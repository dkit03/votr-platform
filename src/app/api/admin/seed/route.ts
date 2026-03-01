import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

// POST /api/admin/seed — generates realistic sample data for demo purposes
export async function POST(req: NextRequest) {
    try {
        const { bandId, qrCount = 500 } = await req.json();

        if (!bandId) {
            return NextResponse.json({ error: 'bandId required.' }, { status: 400 });
        }

        const supabase = createServiceClient();

        // Get band info
        const { data: band } = await supabase
            .from('bands')
            .select('name, slug')
            .eq('id', bandId)
            .single();

        if (!band) {
            return NextResponse.json({ error: 'Band not found.' }, { status: 404 });
        }

        // Get all active songs
        const { data: songs } = await supabase
            .from('songs')
            .select('id, title, artist')
            .order('display_order', { ascending: true });

        if (!songs || songs.length === 0) {
            return NextResponse.json({ error: 'No active songs found.' }, { status: 400 });
        }

        // 1. Clear existing sample data for this band
        await supabase.from('votes').delete().eq('band_id', bandId);
        await supabase.from('anomaly_flags').delete().eq('band_id', bandId);
        await supabase.from('qr_codes').delete().eq('band_id', bandId);
        await supabase.from('sections').delete().eq('band_id', bandId);

        // 2. Create sections
        const sectionNames = ['Front Line', 'Back Line', 'Island People', 'VIP', 'Truck'];
        const { data: createdSections } = await supabase
            .from('sections')
            .insert(sectionNames.map(name => ({ band_id: bandId, name })))
            .select('id, name');

        const sections = createdSections || [];

        // 3. Generate QR codes assigned to sections
        const prefix = (band.slug || 'VOTR').toUpperCase().slice(0, 4);
        const qrRecords = Array.from({ length: qrCount }, (_, i) => {
            const hex = randomBytes(4).toString('hex').toUpperCase();
            // Distribute QR codes across sections: 30%, 25%, 20%, 15%, 10%
            const sectionWeights = [0.30, 0.55, 0.75, 0.90, 1.0];
            const roll = i / qrCount;
            const sectionIdx = sectionWeights.findIndex(w => roll < w);
            return {
                band_id: bandId,
                section_id: sections[sectionIdx]?.id || sections[0]?.id || null,
                code_string: `${prefix}-${hex.slice(0, 4)}-${hex.slice(4, 8)}`,
                voted: false,
                scanned_at: null,
                voted_at: null,
            };
        });

        // Insert in batches of 100
        const insertedQrs: { id: string; section_id: string | null }[] = [];
        for (let i = 0; i < qrRecords.length; i += 100) {
            const batch = qrRecords.slice(i, i + 100);
            const { data } = await supabase
                .from('qr_codes')
                .insert(batch)
                .select('id, section_id');
            if (data) insertedQrs.push(...data);
        }
        const insertedQrIds = insertedQrs.map(q => q.id);

        // 3. Simulate voting: ~65% participation
        const voterCount = Math.floor(qrCount * 0.65);
        const voterQrIds = insertedQrIds.slice(0, voterCount);

        // Add scanned-but-not-voted: ~10% more
        const scannedOnlyCount = Math.floor(qrCount * 0.10);
        const scannedOnlyIds = insertedQrIds.slice(voterCount, voterCount + scannedOnlyCount);

        // Mark scanned-only QR codes
        const now = new Date();
        for (const id of scannedOnlyIds) {
            const scannedTime = new Date(now.getTime() - Math.random() * 8 * 60 * 60 * 1000);
            await supabase.from('qr_codes').update({
                scanned_at: scannedTime.toISOString(),
            }).eq('id', id);
        }

        // 4. Create vote distribution — Encore gets the most
        // Find Encore song
        const encoreIdx = songs.findIndex(s => s.title.toLowerCase().includes('encore'));

        // Vote weights: Encore gets ~22%, next 3 get ~12% each, rest share the remainder
        const weights: number[] = songs.map((_, i) => {
            if (i === (encoreIdx >= 0 ? encoreIdx : 0)) return 22; // Encore / first song
            if (i === 1) return 14; // Cyah Behave
            if (i === 2) return 12; // Road Man
            if (i === 3) return 11; // Capital
            if (i === 4) return 8;  // Leggo
            if (i === 5) return 6;  // Pensioner's Anthem
            if (i < 10) return 4;
            return 2;
        });
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        // Create vote records with section_id from the QR code
        const voteRecords: { band_id: string; qr_code_id: string; song_id: string; section_id: string | null; created_at: string }[] = [];

        for (let i = 0; i < voterQrIds.length; i++) {
            // Pick a song based on weighted probability
            const roll = Math.random() * totalWeight;
            let cumulative = 0;
            let songIdx = 0;
            for (let j = 0; j < weights.length; j++) {
                cumulative += weights[j];
                if (roll <= cumulative) {
                    songIdx = j;
                    break;
                }
            }

            // Random time spread over 8 hours (carnival day 8am-4pm)
            const voteTime = new Date(now.getTime() - Math.random() * 8 * 60 * 60 * 1000);

            // Get the section from the QR code
            const qrData = insertedQrs.find(q => q.id === voterQrIds[i]);

            voteRecords.push({
                band_id: bandId,
                qr_code_id: voterQrIds[i],
                song_id: songs[songIdx].id,
                section_id: qrData?.section_id || null,
                created_at: voteTime.toISOString(),
            });
        }

        // Insert votes in batches
        for (let i = 0; i < voteRecords.length; i += 100) {
            const batch = voteRecords.slice(i, i + 100);
            await supabase.from('votes').insert(batch);
        }

        // Mark QR codes as voted
        for (let i = 0; i < voterQrIds.length; i += 100) {
            const batchIds = voterQrIds.slice(i, i + 100);
            for (const id of batchIds) {
                const scannedTime = new Date(now.getTime() - Math.random() * 8 * 60 * 60 * 1000);
                await supabase.from('qr_codes').update({
                    voted: true,
                    voted_at: voteRecords.find(v => v.qr_code_id === id)?.created_at || now.toISOString(),
                    scanned_at: scannedTime.toISOString(),
                }).eq('id', id);
            }
        }

        // 5. Add a couple anomaly flags for realism
        const anomalies = [
            {
                band_id: bandId,
                flag_type: 'rapid_voting',
                severity: 'low',
                details: { description: '3 votes from same IP within 2 minutes — likely shared WiFi at staging area' },
                reviewed: true,
            },
            {
                band_id: bandId,
                flag_type: 'ip_cluster',
                severity: 'medium',
                details: { description: '8 votes from IP 203.0.113.42 — mobile hotspot at truck 3' },
                reviewed: false,
            },
        ];
        await supabase.from('anomaly_flags').insert(anomalies);

        // Count results
        const songVoteCounts: Record<string, number> = {};
        for (const v of voteRecords) {
            songVoteCounts[v.song_id] = (songVoteCounts[v.song_id] || 0) + 1;
        }

        const leaderboard = Object.entries(songVoteCounts)
            .map(([songId, count]) => ({
                title: songs.find(s => s.id === songId)?.title || 'Unknown',
                votes: count,
            }))
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 5);

        return NextResponse.json({
            success: true,
            summary: {
                qrCodesGenerated: insertedQrIds.length,
                totalVotes: voteRecords.length,
                scannedNotVoted: scannedOnlyCount,
                unused: qrCount - voterCount - scannedOnlyCount,
                participationRate: `${Math.round((voterCount / qrCount) * 100)}%`,
                topSongs: leaderboard,
            },
        });
    } catch (error) {
        console.error('[Seed] Error:', error);
        return NextResponse.json({ error: 'Failed to seed data.' }, { status: 500 });
    }
}
