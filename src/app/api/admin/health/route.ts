import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/admin/health — platform health metrics
export async function GET() {
    try {
        const supabase = createServiceClient();

        // High-level counts
        const [bands, qrCounts, voteCounts, anomCounts, songCounts] = await Promise.all([
            supabase.from('bands').select('id, name, is_active, tier'),
            supabase.from('qr_codes').select('id', { count: 'exact', head: true }),
            supabase.from('votes').select('id', { count: 'exact', head: true }),
            supabase.from('anomaly_flags').select('id, reviewed', { count: 'exact' }),
            supabase.from('songs').select('id', { count: 'exact', head: true }),
        ]);

        const totalBands = bands.data?.length || 0;
        const activeBands = bands.data?.filter(b => b.is_active).length || 0;
        const totalQr = qrCounts.count || 0;
        const totalVotes = voteCounts.count || 0;
        const totalSongs = songCounts.count || 0;

        // Anomaly breakdown
        const anomData = anomCounts.data || [];
        const totalAnomalies = anomData.length;
        const unreviewedAnomalies = anomData.filter((a: { reviewed: boolean }) => !a.reviewed).length;

        // Recent votes (last 24h)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: recentVotes } = await supabase
            .from('votes')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', yesterday);

        // Health checks
        const checks = [
            {
                name: 'Database Connection',
                status: 'healthy' as const,
                detail: 'Supabase responding normally',
            },
            {
                name: 'Active Bands',
                status: activeBands > 0 ? 'healthy' as const : 'warning' as const,
                detail: `${activeBands} of ${totalBands} bands active`,
            },
            {
                name: 'Anomaly Queue',
                status: unreviewedAnomalies === 0 ? 'healthy' as const : unreviewedAnomalies < 5 ? 'warning' as const : 'critical' as const,
                detail: `${unreviewedAnomalies} unreviewed flags`,
            },
            {
                name: 'Song Library',
                status: totalSongs > 0 ? 'healthy' as const : 'warning' as const,
                detail: `${totalSongs} songs loaded`,
            },
            {
                name: 'QR Code Stock',
                status: totalQr > 0 ? 'healthy' as const : 'warning' as const,
                detail: `${totalQr} codes generated`,
            },
            {
                name: 'Vote Activity (24h)',
                status: 'healthy' as const,
                detail: `${recentVotes || 0} votes in last 24 hours`,
            },
        ];

        const overallStatus = checks.some(c => c.status === 'critical')
            ? 'critical'
            : checks.some(c => c.status === 'warning')
                ? 'warning'
                : 'healthy';

        return NextResponse.json({
            status: overallStatus,
            checks,
            metrics: {
                totalBands,
                activeBands,
                totalQr,
                totalVotes,
                totalAnomalies,
                unreviewedAnomalies,
                totalSongs,
                recentVotes: recentVotes || 0,
            },
        });
    } catch (error) {
        console.error('[Health API] Error:', error);
        return NextResponse.json({
            status: 'critical',
            checks: [{ name: 'Database Connection', status: 'critical', detail: 'Failed to connect' }],
            metrics: {},
        }, { status: 500 });
    }
}
