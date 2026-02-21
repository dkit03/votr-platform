import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/admin/bands — list all bands with details
export async function GET() {
    try {
        const supabase = createServiceClient();
        const { data: bands, error } = await supabase
            .from('bands')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ bands: bands || [] });
    } catch (error) {
        console.error('[Admin Bands] Error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}

// POST /api/admin/bands — create a new band
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, slug, tier, contactEmail, contactPhone, maxMasqueraders, votingOpensAt, votingClosesAt } = body;

        if (!name || !slug) {
            return NextResponse.json({ error: 'Band name and slug required.' }, { status: 400 });
        }

        const supabase = createServiceClient();

        const { data: band, error } = await supabase
            .from('bands')
            .insert({
                name,
                slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                tier: tier || 'starter',
                contact_email: contactEmail || null,
                contact_phone: contactPhone || null,
                max_masqueraders: maxMasqueraders || 3000,
                voting_opens_at: votingOpensAt || null,
                voting_closes_at: votingClosesAt || null,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') return NextResponse.json({ error: 'Slug already taken.' }, { status: 409 });
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ band }, { status: 201 });
    } catch (error) {
        console.error('[Admin Bands] Error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}
