import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Force dynamic rendering (not pre-rendered at build time)
export const dynamic = 'force-dynamic';

// Rate limiting in-memory store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_VOTES_PER_IP || '10');
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_HOURS || '1') * 60 * 60 * 1000;

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(ip);

    if (!entry || now > entry.resetAt) {
        rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
    }

    if (entry.count >= RATE_LIMIT_MAX) {
        return { allowed: false, remaining: 0 };
    }

    entry.count++;
    return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

function generateDeviceHash(req: NextRequest): string {
    const ua = req.headers.get('user-agent') || '';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const accept = req.headers.get('accept-language') || '';
    // Simple hash - in production, use client-side fingerprinting too
    const raw = `${ua}|${ip}|${accept}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code, songId, clientFingerprint } = body;

        // Validate required fields
        if (!code || !songId) {
            return NextResponse.json(
                { error: 'Missing required fields', code: 'MISSING_FIELDS' },
                { status: 400 }
            );
        }

        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const userAgent = req.headers.get('user-agent') || '';

        // 1. Rate limit check
        const rateCheck = checkRateLimit(ip);
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
                { status: 429 }
            );
        }

        const supabase = createServiceClient();

        // 2. Validate QR code exists
        const { data: qrCode, error: qrError } = await supabase
            .from('qr_codes')
            .select('*, bands!inner(voting_opens_at, voting_closes_at, name)')
            .eq('code_string', code)
            .single();

        if (qrError || !qrCode) {
            return NextResponse.json(
                { error: 'Invalid QR code.', code: 'INVALID_CODE' },
                { status: 404 }
            );
        }

        // 3. Check if already voted
        if (qrCode.voted) {
            return NextResponse.json(
                { error: 'You have already voted!', code: 'ALREADY_VOTED', votedAt: qrCode.voted_at },
                { status: 409 }
            );
        }

        // 4. Check voting window
        const now = new Date();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const band: any = qrCode.bands;

        if (band.voting_opens_at && new Date(band.voting_opens_at) > now) {
            return NextResponse.json(
                { error: 'Voting has not opened yet.', code: 'VOTING_NOT_OPEN', opensAt: band.voting_opens_at },
                { status: 403 }
            );
        }

        if (band.voting_closes_at && new Date(band.voting_closes_at) < now) {
            return NextResponse.json(
                { error: 'Voting has closed.', code: 'VOTING_CLOSED', closedAt: band.voting_closes_at },
                { status: 403 }
            );
        }

        // 5. Validate song exists
        const { data: song, error: songError } = await supabase
            .from('songs')
            .select('id, title, artist')
            .eq('id', songId)
            .eq('is_active', true)
            .single();

        if (songError || !song) {
            return NextResponse.json(
                { error: 'Invalid song selection.', code: 'INVALID_SONG' },
                { status: 400 }
            );
        }

        // 6. Generate device hash
        const deviceHash = clientFingerprint || generateDeviceHash(req);

        // 7. Insert vote (use transaction-like approach)
        // First mark QR as voted
        const { error: updateError } = await supabase
            .from('qr_codes')
            .update({
                voted: true,
                voted_at: now.toISOString(),
                scanned_at: qrCode.scanned_at || now.toISOString(),
                device_hash: deviceHash,
            })
            .eq('id', qrCode.id)
            .eq('voted', false); // Optimistic lock - only update if still unvoted

        if (updateError) {
            return NextResponse.json(
                { error: 'Failed to record vote. Please try again.', code: 'VOTE_FAILED' },
                { status: 500 }
            );
        }

        // 8. Insert vote record
        const { error: voteError } = await supabase
            .from('votes')
            .insert({
                qr_code_id: qrCode.id,
                band_id: qrCode.band_id,
                section_id: qrCode.section_id,
                song_id: songId,
                device_hash: deviceHash,
                ip_address: ip,
                user_agent: userAgent,
            });

        if (voteError) {
            // Rollback QR code status
            await supabase
                .from('qr_codes')
                .update({ voted: false, voted_at: null, device_hash: null })
                .eq('id', qrCode.id);

            return NextResponse.json(
                { error: 'Failed to record vote. Please try again.', code: 'VOTE_FAILED' },
                { status: 500 }
            );
        }

        // 9. Track analytics event
        await supabase.from('analytics_events').insert({
            band_id: qrCode.band_id,
            event_type: 'vote_cast',
            metadata: {
                section_id: qrCode.section_id,
                song_id: songId,
                device_hash: deviceHash,
            },
            ip_address: ip,
            user_agent: userAgent,
        });

        // 10. Run anomaly detection (async, non-blocking)
        detectAnomalies(supabase, qrCode.band_id, deviceHash, ip).catch(console.error);

        return NextResponse.json({
            success: true,
            message: 'Vote recorded successfully!',
            song: { title: song.title, artist: song.artist },
            bandName: band.name,
        });

    } catch (error) {
        console.error('[Vote API] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}

// Async anomaly detection
async function detectAnomalies(
    supabase: ReturnType<typeof createServiceClient>,
    bandId: string,
    deviceHash: string,
    ip: string
) {
    try {
        // Check for multiple votes from same device hash
        const { data: deviceVotes } = await supabase
            .from('votes')
            .select('id')
            .eq('device_hash', deviceHash)
            .eq('band_id', bandId);

        if (deviceVotes && deviceVotes.length >= 3) {
            await supabase.from('anomaly_flags').insert({
                band_id: bandId,
                flag_type: 'multiple_devices',
                severity: deviceVotes.length >= 5 ? 'high' : 'medium',
                details: {
                    device_hash: deviceHash,
                    vote_count: deviceVotes.length,
                    description: `${deviceVotes.length} votes from the same device fingerprint`,
                },
            });
        }

        // Check for IP cluster (many votes from same IP in short window)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: ipVotes } = await supabase
            .from('votes')
            .select('id')
            .eq('ip_address', ip)
            .eq('band_id', bandId)
            .gte('created_at', oneHourAgo);

        if (ipVotes && ipVotes.length >= 20) {
            await supabase.from('anomaly_flags').insert({
                band_id: bandId,
                flag_type: 'ip_cluster',
                severity: ipVotes.length >= 50 ? 'high' : 'medium',
                details: {
                    ip_address: ip,
                    vote_count: ipVotes.length,
                    window: '1 hour',
                    description: `${ipVotes.length} votes from the same IP in 1 hour`,
                },
            });
        }
    } catch (error) {
        console.error('[Anomaly Detection] Error:', error);
    }
}
