import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/analytics/report?bandId=xxx — generate sponsor report data
export async function GET(req: NextRequest) {
    try {
        const bandId = req.nextUrl.searchParams.get('bandId');
        if (!bandId) return NextResponse.json({ error: 'bandId required' }, { status: 400 });

        const supabase = createServiceClient();

        // Band info
        const { data: band } = await supabase
            .from('bands')
            .select('*')
            .eq('id', bandId)
            .single();

        if (!band) return NextResponse.json({ error: 'Band not found' }, { status: 404 });

        // All parallel queries
        const [songsRes, votesRes, qrRes, sectionsRes, anomaliesRes] = await Promise.all([
            supabase.from('songs').select('id, title, artist').eq('is_active', true),
            supabase.from('votes').select('id, song_id, section_id, created_at').eq('band_id', bandId),
            supabase.from('qr_codes').select('id, voted, scanned_at, section_id').eq('band_id', bandId),
            supabase.from('sections').select('id, name').eq('band_id', bandId),
            supabase.from('anomaly_flags').select('id, flag_type, severity, reviewed').eq('band_id', bandId),
        ]);

        const songs = songsRes.data || [];
        const votes = votesRes.data || [];
        const qrCodes = qrRes.data || [];
        const sections = sectionsRes.data || [];
        const anomalies = anomaliesRes.data || [];

        // Song leaderboard
        const songVotes = new Map<string, number>();
        votes.forEach(v => songVotes.set(v.song_id, (songVotes.get(v.song_id) || 0) + 1));

        const leaderboard = songs
            .map(s => ({
                title: s.title,
                artist: s.artist,
                votes: songVotes.get(s.id) || 0,
                percentage: votes.length > 0 ? Math.round(((songVotes.get(s.id) || 0) / votes.length) * 100) : 0,
            }))
            .sort((a, b) => b.votes - a.votes);

        // Section breakdown
        const sectionStats = sections.map(sec => {
            const sectionQr = qrCodes.filter(q => q.section_id === sec.id);
            const sectionVotes = votes.filter(v => v.section_id === sec.id);
            return {
                name: sec.name,
                qrCodes: sectionQr.length,
                votes: sectionVotes.length,
                participation: sectionQr.length > 0 ? Math.round((sectionVotes.length / sectionQr.length) * 100) : 0,
            };
        }).sort((a, b) => b.participation - a.participation);

        // Voting timeline (hourly)
        const hourlyVotes = new Map<string, number>();
        votes.forEach(v => {
            const hour = new Date(v.created_at).toISOString().slice(0, 13) + ':00';
            hourlyVotes.set(hour, (hourlyVotes.get(hour) || 0) + 1);
        });
        const timeline = Array.from(hourlyVotes.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([hour, count]) => ({ hour, count }));

        // Key metrics
        const totalQr = qrCodes.length;
        const totalVotes = votes.length;
        const scanned = qrCodes.filter(q => q.scanned_at).length;
        const participation = totalQr > 0 ? Math.round((totalVotes / totalQr) * 100) : 0;
        const scanRate = totalQr > 0 ? Math.round((scanned / totalQr) * 100) : 0;
        const dataIntegrity = anomalies.length > 0
            ? Math.round(((totalVotes - anomalies.filter(a => a.severity === 'high').length) / Math.max(totalVotes, 1)) * 100)
            : 100;

        return NextResponse.json({
            band: { name: band.name, tier: band.tier, slug: band.slug },
            generatedAt: new Date().toISOString(),
            metrics: {
                totalQrCodes: totalQr,
                totalVotes,
                totalScanned: scanned,
                participationRate: participation,
                scanRate,
                dataIntegrity,
                totalAnomalies: anomalies.length,
                reviewedAnomalies: anomalies.filter(a => a.reviewed).length,
                totalSections: sections.length,
            },
            leaderboard,
            sectionStats,
            timeline,
        });
    } catch (error) {
        console.error('[Report API] Error:', error);
        return NextResponse.json({ error: 'Failed to generate report.' }, { status: 500 });
    }
}
