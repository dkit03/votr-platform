import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/analytics/overview?band_id=xxx
// Returns Starter tier analytics data
export async function GET(req: NextRequest) {
    try {
        const bandId = req.nextUrl.searchParams.get('band_id');

        if (!bandId) {
            return NextResponse.json(
                { error: 'band_id is required', code: 'MISSING_BAND' },
                { status: 400 }
            );
        }

        const supabase = createServiceClient();

        // Fetch band info
        const { data: band } = await supabase
            .from('bands')
            .select('name, tier, voting_opens_at, voting_closes_at')
            .eq('id', bandId)
            .single();

        // Total QR codes issued
        const { count: totalQrCodes } = await supabase
            .from('qr_codes')
            .select('id', { count: 'exact', head: true })
            .eq('band_id', bandId);

        // Total votes cast
        const { count: totalVotes } = await supabase
            .from('votes')
            .select('id', { count: 'exact', head: true })
            .eq('band_id', bandId);

        // QR codes scanned but not voted
        const { count: scannedNotVoted } = await supabase
            .from('qr_codes')
            .select('id', { count: 'exact', head: true })
            .eq('band_id', bandId)
            .eq('voted', false)
            .not('scanned_at', 'is', null);

        // Song vote breakdown
        const { data: songVotes } = await supabase
            .from('votes')
            .select('song_id, songs(title, artist)')
            .eq('band_id', bandId);

        // Aggregate song votes
        const songCounts: Record<string, { title: string; artist: string; count: number }> = {};
        if (songVotes) {
            for (const vote of songVotes) {
                const songId = vote.song_id;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const song: any = vote.songs;
                if (!songCounts[songId]) {
                    songCounts[songId] = {
                        title: song?.title || 'Unknown',
                        artist: song?.artist || 'Unknown',
                        count: 0,
                    };
                }
                songCounts[songId].count++;
            }
        }

        const songLeaderboard = Object.entries(songCounts)
            .map(([songId, data]) => ({
                songId,
                title: data.title,
                artist: data.artist,
                votes: data.count,
                percentage: totalVotes ? Math.round((data.count / totalVotes) * 100) : 0,
            }))
            .sort((a, b) => b.votes - a.votes);

        // Voting activity by hour
        const { data: voteTimestamps } = await supabase
            .from('votes')
            .select('created_at')
            .eq('band_id', bandId);

        const hourlyActivity: Record<number, number> = {};
        if (voteTimestamps) {
            for (const v of voteTimestamps) {
                const hour = new Date(v.created_at).getHours();
                hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
            }
        }

        const activityTimeline = Array.from({ length: 24 }, (_, h) => ({
            hour: h,
            label: `${h.toString().padStart(2, '0')}:00`,
            votes: hourlyActivity[h] || 0,
        }));

        // Anomaly summary
        const { count: totalAnomalies } = await supabase
            .from('anomaly_flags')
            .select('id', { count: 'exact', head: true })
            .eq('band_id', bandId);

        const { count: unreviewedAnomalies } = await supabase
            .from('anomaly_flags')
            .select('id', { count: 'exact', head: true })
            .eq('band_id', bandId)
            .eq('reviewed', false);

        // Calculate metrics
        const participationRate = totalQrCodes ? Math.round(((totalVotes || 0) / totalQrCodes) * 100) : 0;
        const abandonmentRate = (scannedNotVoted && totalQrCodes)
            ? Math.round((scannedNotVoted / totalQrCodes) * 100) : 0;
        const anomalyRate = totalVotes ? Math.round(((totalAnomalies || 0) / totalVotes) * 100) : 0;

        // Data confidence
        let dataConfidence: 'High' | 'Medium' | 'Low' = 'High';
        if (anomalyRate > 10) dataConfidence = 'Low';
        else if (anomalyRate > 5) dataConfidence = 'Medium';

        return NextResponse.json({
            band: band || { name: 'Unknown', tier: 'starter' },
            metrics: {
                totalQrCodes: totalQrCodes || 0,
                totalVotes: totalVotes || 0,
                participationRate,
                abandonmentRate,
                anomalyRate,
                dataConfidence,
            },
            songLeaderboard,
            activityTimeline,
            anomalySummary: {
                total: totalAnomalies || 0,
                unreviewed: unreviewedAnomalies || 0,
            },
            winningSong: songLeaderboard[0] || null,
        });

    } catch (error) {
        console.error('[Analytics] Overview error:', error);
        return NextResponse.json(
            { error: 'Failed to load analytics.', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}
