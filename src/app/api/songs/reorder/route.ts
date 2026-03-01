import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/songs/reorder — batch update display order
export async function POST(req: NextRequest) {
    try {
        const { orderedIds } = await req.json();

        if (!orderedIds || !Array.isArray(orderedIds)) {
            return NextResponse.json({ error: 'orderedIds array required.' }, { status: 400 });
        }

        const supabase = createServiceClient();

        // Update each song's display_order based on array position
        const updates = orderedIds.map((id: string, index: number) =>
            supabase
                .from('songs')
                .update({ display_order: index })
                .eq('id', id)
        );

        await Promise.all(updates);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Songs Reorder] Error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}
