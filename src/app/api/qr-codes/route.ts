import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

// GET /api/qr-codes?band_id=xxx — list QR codes for a band
export async function GET(req: NextRequest) {
    try {
        const bandId = req.nextUrl.searchParams.get('band_id');
        const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
        const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
        const filter = req.nextUrl.searchParams.get('filter') || 'all'; // all, voted, unvoted, scanned

        if (!bandId) {
            return NextResponse.json({ error: 'band_id required.' }, { status: 400 });
        }

        const supabase = createServiceClient();
        const offset = (page - 1) * limit;

        let query = supabase
            .from('qr_codes')
            .select('*, sections(name)', { count: 'exact' })
            .eq('band_id', bandId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (filter === 'voted') query = query.eq('voted', true);
        if (filter === 'unvoted') query = query.eq('voted', false);
        if (filter === 'scanned') query = query.not('scanned_at', 'is', null).eq('voted', false);

        const { data: qrCodes, count, error } = await query;

        if (error) {
            return NextResponse.json({ error: 'Failed to load QR codes.' }, { status: 500 });
        }

        return NextResponse.json({
            qrCodes: qrCodes || [],
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit),
        });
    } catch (error) {
        console.error('[QR API] Error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}

// POST /api/qr-codes — generate QR codes in bulk
export async function POST(req: NextRequest) {
    try {
        const { bandId, sectionId, count, prefix } = await req.json();

        if (!bandId || !count) {
            return NextResponse.json({ error: 'bandId and count required.' }, { status: 400 });
        }

        if (count > 2000) {
            return NextResponse.json({ error: 'Max 2,000 codes per batch.' }, { status: 400 });
        }

        const supabase = createServiceClient();
        const bandPrefix = prefix || 'VOTR';

        // Generate unique codes
        const codes = Array.from({ length: count }, () => {
            const hex = randomBytes(4).toString('hex').toUpperCase();
            return `${bandPrefix}-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
        });

        const records = codes.map(code => ({
            band_id: bandId,
            section_id: sectionId || null,
            code_string: code,
        }));

        const { data, error } = await supabase
            .from('qr_codes')
            .insert(records)
            .select('id, code_string');

        if (error) {
            console.error('[QR API] Insert error:', error);
            return NextResponse.json({ error: 'Failed to generate codes.' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            generated: data?.length || 0,
            codes: data,
        }, { status: 201 });
    } catch (error) {
        console.error('[QR API] Error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}
