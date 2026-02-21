import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/analytics/sections?band_id=xxx
export async function GET(req: NextRequest) {
    try {
        const bandId = req.nextUrl.searchParams.get('band_id');
        if (!bandId) {
            return NextResponse.json({ error: 'band_id required.' }, { status: 400 });
        }

        const supabase = createServiceClient();

        // Get all sections for the band
        const { data: sections } = await supabase
            .from('sections')
            .select('id, name')
            .eq('band_id', bandId)
            .order('name');

        if (!sections || sections.length === 0) {
            return NextResponse.json({ sections: [] });
        }

        const sectionData = await Promise.all(sections.map(async (section) => {
            // QR codes for this section
            const { count: totalQr } = await supabase
                .from('qr_codes')
                .select('id', { count: 'exact', head: true })
                .eq('band_id', bandId)
                .eq('section_id', section.id);

            // Votes for this section
            const { count: totalVotes } = await supabase
                .from('votes')
                .select('id', { count: 'exact', head: true })
                .eq('band_id', bandId)
                .eq('section_id', section.id);

            // Top song for this section
            const { data: sectionVotes } = await supabase
                .from('votes')
                .select('song_id, songs(title, artist)')
                .eq('band_id', bandId)
                .eq('section_id', section.id);

            let topSong = null;
            if (sectionVotes && sectionVotes.length > 0) {
                const songCounts: Record<string, { title: string; artist: string; count: number }> = {};
                for (const v of sectionVotes) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const song: any = v.songs;
                    if (!songCounts[v.song_id]) {
                        songCounts[v.song_id] = { title: song?.title || '', artist: song?.artist || '', count: 0 };
                    }
                    songCounts[v.song_id].count++;
                }
                const sorted = Object.values(songCounts).sort((a, b) => b.count - a.count);
                topSong = sorted[0] ? { title: sorted[0].title, artist: sorted[0].artist, votes: sorted[0].count } : null;
            }

            return {
                sectionId: section.id,
                sectionName: section.name,
                totalQr: totalQr || 0,
                totalVotes: totalVotes || 0,
                participationRate: totalQr ? Math.round(((totalVotes || 0) / totalQr) * 100) : 0,
                topSong,
            };
        }));

        // Sort by participation rate descending
        sectionData.sort((a, b) => b.participationRate - a.participationRate);

        return NextResponse.json({ sections: sectionData });
    } catch (error) {
        console.error('[Sections API] Error:', error);
        return NextResponse.json({ error: 'Failed to load section data.' }, { status: 500 });
    }
}
