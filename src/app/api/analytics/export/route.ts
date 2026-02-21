import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/analytics/export?band_id=xxx&format=csv
export async function GET(req: NextRequest) {
    try {
        const bandId = req.nextUrl.searchParams.get('band_id');
        const format = req.nextUrl.searchParams.get('format') || 'csv';
        const type = req.nextUrl.searchParams.get('type') || 'votes'; // votes, qr_codes, summary

        if (!bandId) {
            return NextResponse.json({ error: 'band_id required.' }, { status: 400 });
        }

        const supabase = createServiceClient();

        if (type === 'votes') {
            const { data: votes } = await supabase
                .from('votes')
                .select('created_at, song_id, songs(title, artist), section_id, sections(name), device_hash')
                .eq('band_id', bandId)
                .order('created_at');

            if (format === 'csv') {
                const header = 'Timestamp,Song Title,Artist,Section,Device Hash';
                const rows = (votes || []).map((v) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const song: any = v.songs;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const section: any = v.sections;
                    return [
                        new Date(v.created_at).toISOString(),
                        `"${song?.title || 'N/A'}"`,
                        `"${song?.artist || 'N/A'}"`,
                        `"${section?.name || 'N/A'}"`,
                        v.device_hash || 'N/A',
                    ].join(',');
                });

                const csv = [header, ...rows].join('\n');
                return new NextResponse(csv, {
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': `attachment; filename="votr-votes-${new Date().toISOString().slice(0, 10)}.csv"`,
                    },
                });
            }

            return NextResponse.json({ votes });
        }

        if (type === 'qr_codes') {
            const { data: codes } = await supabase
                .from('qr_codes')
                .select('code_string, masquerader_name, masquerader_email, voted, voted_at, scanned_at, sections(name)')
                .eq('band_id', bandId)
                .order('created_at');

            if (format === 'csv') {
                const header = 'QR Code,Name,Email,Section,Scanned,Voted,Voted At';
                const rows = (codes || []).map((c) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const section: any = c.sections;
                    return [
                        c.code_string,
                        `"${c.masquerader_name || ''}"`,
                        `"${c.masquerader_email || ''}"`,
                        `"${section?.name || 'N/A'}"`,
                        c.scanned_at ? 'Yes' : 'No',
                        c.voted ? 'Yes' : 'No',
                        c.voted_at ? new Date(c.voted_at).toISOString() : '',
                    ].join(',');
                });

                const csv = [header, ...rows].join('\n');
                return new NextResponse(csv, {
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': `attachment; filename="votr-qrcodes-${new Date().toISOString().slice(0, 10)}.csv"`,
                    },
                });
            }

            return NextResponse.json({ codes });
        }

        if (type === 'summary') {
            // Summary report data
            const { count: totalQr } = await supabase
                .from('qr_codes')
                .select('id', { count: 'exact', head: true })
                .eq('band_id', bandId);

            const { count: totalVotes } = await supabase
                .from('votes')
                .select('id', { count: 'exact', head: true })
                .eq('band_id', bandId);

            const { data: songVotes } = await supabase
                .from('votes')
                .select('song_id, songs(title, artist)')
                .eq('band_id', bandId);

            const songCounts: Record<string, { title: string; artist: string; count: number }> = {};
            if (songVotes) {
                for (const v of songVotes) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const song: any = v.songs;
                    if (!songCounts[v.song_id]) {
                        songCounts[v.song_id] = { title: song?.title || '', artist: song?.artist || '', count: 0 };
                    }
                    songCounts[v.song_id].count++;
                }
            }

            const leaderboard = Object.values(songCounts).sort((a, b) => b.count - a.count);

            const { data: band } = await supabase
                .from('bands')
                .select('name')
                .eq('id', bandId)
                .single();

            if (format === 'csv') {
                const lines = [
                    `VOTR Engagement Summary Report`,
                    `Band: ${band?.name || 'N/A'}`,
                    `Generated: ${new Date().toISOString()}`,
                    ``,
                    `Total QR Codes Issued,${totalQr || 0}`,
                    `Total Votes Cast,${totalVotes || 0}`,
                    `Participation Rate,${totalQr ? Math.round(((totalVotes || 0) / totalQr) * 100) : 0}%`,
                    ``,
                    `Song Leaderboard`,
                    `Rank,Song,Artist,Votes,Percentage`,
                    ...leaderboard.map((s, i) => [
                        i + 1,
                        `"${s.title}"`,
                        `"${s.artist}"`,
                        s.count,
                        `${totalVotes ? Math.round((s.count / totalVotes) * 100) : 0}%`,
                    ].join(',')),
                ];

                const csv = lines.join('\n');
                return new NextResponse(csv, {
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': `attachment; filename="votr-summary-${new Date().toISOString().slice(0, 10)}.csv"`,
                    },
                });
            }

            return NextResponse.json({
                band: band?.name,
                totalQr: totalQr || 0,
                totalVotes: totalVotes || 0,
                participationRate: totalQr ? Math.round(((totalVotes || 0) / totalQr) * 100) : 0,
                leaderboard,
            });
        }

        return NextResponse.json({ error: 'Invalid type.' }, { status: 400 });

    } catch (error) {
        console.error('[Export API] Error:', error);
        return NextResponse.json({ error: 'Failed to export.' }, { status: 500 });
    }
}
