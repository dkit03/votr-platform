import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/activity?band_id=xxx — get recent activity for a band
export async function GET(req: NextRequest) {
    try {
        const bandId = req.nextUrl.searchParams.get('band_id');
        const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

        if (!bandId) {
            return NextResponse.json({ error: 'band_id is required' }, { status: 400 });
        }

        const supabase = createServiceClient();

        // Get recent votes with song info
        const { data: recentVotes } = await supabase
            .from('votes')
            .select('id, created_at, song_id, qr_code_id, songs(title, artist), qr_codes(code_string, section_id, sections(name))')
            .eq('band_id', bandId)
            .order('created_at', { ascending: false })
            .limit(limit);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activities = (recentVotes || []).map((vote: any) => ({
            id: vote.id,
            type: 'vote' as const,
            description: `Vote cast for "${vote.songs?.title || 'Unknown'}" by ${vote.songs?.artist || 'Unknown'}`,
            timestamp: vote.created_at,
            section: vote.qr_codes?.sections?.name || null,
        }));

        return NextResponse.json({ activities });
    } catch (error) {
        console.error('[Activity] Error:', error);
        return NextResponse.json({ error: 'Failed to load activity.' }, { status: 500 });
    }
}
