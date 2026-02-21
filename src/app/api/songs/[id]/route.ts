import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// PATCH /api/songs/[id] — update a song
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        const supabase = createServiceClient();
        const { error } = await supabase
            .from('songs')
            .update(body)
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: 'Failed to update song.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Songs API] Error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}

// DELETE /api/songs/[id] — delete a song
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const supabase = createServiceClient();
        const { error } = await supabase
            .from('songs')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: 'Failed to delete song.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Songs API] Error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}
