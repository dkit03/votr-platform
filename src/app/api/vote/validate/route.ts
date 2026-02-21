import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Force dynamic rendering (not pre-rendered at build time)
export const dynamic = 'force-dynamic';

// GET /api/vote/validate?code=VOTR-TRB-A1B2C3
export async function GET(req: NextRequest) {
    try {
        const code = req.nextUrl.searchParams.get('code');

        if (!code) {
            return NextResponse.json(
                { error: 'Missing QR code', code: 'MISSING_CODE' },
                { status: 400 }
            );
        }

        const supabase = createServiceClient();
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const userAgent = req.headers.get('user-agent') || '';

        // Fetch QR code with band info
        const { data: qrCode, error: qrError } = await supabase
            .from('qr_codes')
            .select(`
                id, code_string, voted, voted_at, section_id,
                bands!inner(id, name, slug, logo_url, colors_json, voting_opens_at, voting_closes_at),
                sections(name)
            `)
            .eq('code_string', code)
            .single();

        if (qrError || !qrCode) {
            return NextResponse.json(
                { error: 'Invalid QR code.', code: 'INVALID_CODE' },
                { status: 404 }
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const band: any = qrCode.bands;

        // Track scan event
        await supabase.from('analytics_events').insert({
            band_id: band.id,
            event_type: 'qr_scan',
            metadata: { code, section_id: qrCode.section_id },
            ip_address: ip,
            user_agent: userAgent,
        });

        // Update scanned_at if first scan
        if (!qrCode.voted_at) {
            await supabase
                .from('qr_codes')
                .update({ scanned_at: new Date().toISOString() })
                .eq('id', qrCode.id)
                .is('scanned_at', null);
        }

        // Check if already voted
        if (qrCode.voted) {
            return NextResponse.json({
                status: 'already_voted',
                votedAt: qrCode.voted_at,
                band: {
                    name: band.name,
                    logo_url: band.logo_url,
                    colors: band.colors_json,
                },
            });
        }

        // Check voting window
        const now = new Date();

        if (band.voting_opens_at && new Date(band.voting_opens_at as string) > now) {
            return NextResponse.json({
                status: 'not_open',
                opensAt: band.voting_opens_at,
                band: { name: band.name, logo_url: band.logo_url, colors: band.colors_json },
            });
        }

        if (band.voting_closes_at && new Date(band.voting_closes_at as string) < now) {
            return NextResponse.json({
                status: 'closed',
                closedAt: band.voting_closes_at,
                band: { name: band.name, logo_url: band.logo_url, colors: band.colors_json },
            });
        }

        // Fetch active songs
        const { data: songs, error: songsError } = await supabase
            .from('songs')
            .select('id, title, artist, thumbnail_url')
            .eq('is_active', true)
            .order('title');

        if (songsError) {
            return NextResponse.json(
                { error: 'Failed to load songs.', code: 'SONGS_ERROR' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            status: 'ready',
            qrCodeId: qrCode.id,
            band: {
                name: band.name,
                slug: band.slug,
                logo_url: band.logo_url,
                colors: band.colors_json,
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            section: qrCode.sections ? (qrCode.sections as any).name : null,
            songs: songs || [],
        });

    } catch (error) {
        console.error('[Validate API] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Something went wrong.', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}
