import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/sections?band_id=xxx — list sections for a band
export async function GET(req: NextRequest) {
    try {
        const bandId = req.nextUrl.searchParams.get('band_id');
        if (!bandId) {
            return NextResponse.json({ error: 'band_id required.' }, { status: 400 });
        }

        const supabase = createServiceClient();
        const { data: sections, error } = await supabase
            .from('sections')
            .select('*')
            .eq('band_id', bandId)
            .order('name');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ sections: sections || [] });
    } catch (error) {
        console.error('[Sections] Error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}

// POST /api/sections — create a new section
export async function POST(req: NextRequest) {
    try {
        const { bandId, name } = await req.json();

        if (!bandId || !name) {
            return NextResponse.json({ error: 'bandId and name required.' }, { status: 400 });
        }

        const supabase = createServiceClient();
        const { data: section, error } = await supabase
            .from('sections')
            .insert({ band_id: bandId, name: name.trim() })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Section name already exists for this band.' }, { status: 409 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ section }, { status: 201 });
    } catch (error) {
        console.error('[Sections] Error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}

// DELETE /api/sections?id=xxx — delete a section
export async function DELETE(req: NextRequest) {
    try {
        const sectionId = req.nextUrl.searchParams.get('id');
        if (!sectionId) {
            return NextResponse.json({ error: 'Section id required.' }, { status: 400 });
        }

        const supabase = createServiceClient();
        const { error } = await supabase
            .from('sections')
            .delete()
            .eq('id', sectionId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Sections] Error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}
