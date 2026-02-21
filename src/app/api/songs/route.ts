import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/songs — list all songs
export async function GET() {
    try {
        const supabase = createServiceClient();
        const { data: songs, error } = await supabase
            .from('songs')
            .select('*')
            .order('title');

        if (error) {
            return NextResponse.json({ error: 'Failed to load songs.' }, { status: 500 });
        }

        return NextResponse.json({ songs });
    } catch (error) {
        console.error('[Songs API] Error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}

// POST /api/songs — add a new song
export async function POST(req: NextRequest) {
    try {
        const { title, artist, year } = await req.json();

        if (!title || !artist) {
            return NextResponse.json({ error: 'Title and artist required.' }, { status: 400 });
        }

        const supabase = createServiceClient();
        const { data: song, error } = await supabase
            .from('songs')
            .insert({ title, artist, year: year || 2027 })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: 'Failed to add song.' }, { status: 500 });
        }

        return NextResponse.json({ song }, { status: 201 });
    } catch (error) {
        console.error('[Songs API] Error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}
