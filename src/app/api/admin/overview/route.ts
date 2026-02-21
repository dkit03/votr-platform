import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/admin/overview — cross-band platform analytics
export async function GET() {
    try {
        const supabase = createServiceClient();

        // All bands
        const { data: bands } = await supabase
            .from('bands')
            .select('id, name, slug, tier, is_active, voting_opens_at, voting_closes_at, contact_email, created_at')
            .order('name');

        // Total counts across platform
        const { count: totalQrCodes } = await supabase
            .from('qr_codes')
            .select('id', { count: 'exact', head: true });

        const { count: totalVotes } = await supabase
            .from('votes')
            .select('id', { count: 'exact', head: true });

        const { count: totalAnomalies } = await supabase
            .from('anomaly_flags')
            .select('id', { count: 'exact', head: true });

        const { count: totalSongs } = await supabase
            .from('songs')
            .select('id', { count: 'exact', head: true });

        // Per-band breakdown
        const bandStats = await Promise.all((bands || []).map(async (band) => {
            const { count: bandQr } = await supabase
                .from('qr_codes')
                .select('id', { count: 'exact', head: true })
                .eq('band_id', band.id);

            const { count: bandVotes } = await supabase
                .from('votes')
                .select('id', { count: 'exact', head: true })
                .eq('band_id', band.id);

            const { count: bandAnomalies } = await supabase
                .from('anomaly_flags')
                .select('id', { count: 'exact', head: true })
                .eq('band_id', band.id)
                .eq('reviewed', false);

            return {
                ...band,
                qrCodes: bandQr || 0,
                votes: bandVotes || 0,
                participationRate: bandQr ? Math.round(((bandVotes || 0) / bandQr) * 100) : 0,
                unreviewedAnomalies: bandAnomalies || 0,
            };
        }));

        // Tier breakdown
        const tierCounts: Record<string, number> = {};
        (bands || []).forEach(b => {
            tierCounts[b.tier] = (tierCounts[b.tier] || 0) + 1;
        });

        // Global song leaderboard
        const { data: allVotes } = await supabase
            .from('votes')
            .select('song_id, songs(title, artist)');

        const songCounts: Record<string, { title: string; artist: string; count: number }> = {};
        if (allVotes) {
            for (const v of allVotes) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const song: any = v.songs;
                if (!songCounts[v.song_id]) {
                    songCounts[v.song_id] = { title: song?.title || '', artist: song?.artist || '', count: 0 };
                }
                songCounts[v.song_id].count++;
            }
        }

        const globalLeaderboard = Object.entries(songCounts)
            .map(([songId, data]) => ({
                songId,
                title: data.title,
                artist: data.artist,
                votes: data.count,
                percentage: totalVotes ? Math.round((data.count / totalVotes) * 100) : 0,
            }))
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 10);

        return NextResponse.json({
            platform: {
                totalBands: bands?.length || 0,
                activeBands: bands?.filter(b => b.is_active).length || 0,
                totalQrCodes: totalQrCodes || 0,
                totalVotes: totalVotes || 0,
                totalAnomalies: totalAnomalies || 0,
                totalSongs: totalSongs || 0,
                globalParticipation: totalQrCodes ? Math.round(((totalVotes || 0) / totalQrCodes) * 100) : 0,
                tierCounts,
            },
            bands: bandStats,
            globalLeaderboard,
        });

    } catch (error) {
        console.error('[Admin Overview] Error:', error);
        return NextResponse.json({ error: 'Failed to load platform data.' }, { status: 500 });
    }
}
