import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/bands/[id] — update a band
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        const supabase = createServiceClient();

        const updateData: Record<string, unknown> = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.tier !== undefined) updateData.tier = body.tier;
        if (body.is_active !== undefined) updateData.is_active = body.is_active;
        if (body.contact_email !== undefined) updateData.contact_email = body.contact_email;
        if (body.contact_phone !== undefined) updateData.contact_phone = body.contact_phone;
        if (body.voting_opens_at !== undefined) updateData.voting_opens_at = body.voting_opens_at;
        if (body.voting_closes_at !== undefined) updateData.voting_closes_at = body.voting_closes_at;
        if (body.max_masqueraders !== undefined) updateData.max_masqueraders = body.max_masqueraders;
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('bands')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ band: data });
    } catch (error) {
        console.error('[Admin Bands] Error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}

// DELETE /api/admin/bands/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = createServiceClient();

        const { error } = await supabase
            .from('bands')
            .delete()
            .eq('id', id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Admin Bands] Error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}
