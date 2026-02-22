import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

// GET /api/qr-codes/print?bandId=xxx&section=all|sectionId&limit=50
export async function GET(req: NextRequest) {
    try {
        const bandId = req.nextUrl.searchParams.get('bandId');
        const section = req.nextUrl.searchParams.get('section') || 'all';
        const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 200);
        const baseUrl = req.nextUrl.searchParams.get('baseUrl') || 'https://votr-platform.vercel.app';

        if (!bandId) {
            return NextResponse.json({ error: 'bandId required' }, { status: 400 });
        }

        const supabase = createServiceClient();

        // Fetch QR codes with section info
        let query = supabase
            .from('qr_codes')
            .select('id, code_string, section_id, voted, sections(name)')
            .eq('band_id', bandId)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (section !== 'all') {
            query = query.eq('section_id', section);
        }

        const { data: codes, error } = await query;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Fetch band info
        const { data: band } = await supabase
            .from('bands')
            .select('name, slug')
            .eq('id', bandId)
            .single();

        // Generate QR code data URLs for each code
        const qrCodes = await Promise.all((codes || []).map(async (code) => {
            const voteUrl = `${baseUrl}/vote/${code.code_string}`;
            const qrDataUrl = await QRCode.toDataURL(voteUrl, {
                width: 200,
                margin: 1,
                color: { dark: '#000000', light: '#FFFFFF' },
                errorCorrectionLevel: 'M',
            });

            return {
                id: code.id,
                codeString: code.code_string,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                section: (code.sections as any)?.name || 'Unassigned',
                voted: code.voted,
                voteUrl,
                qrDataUrl,
            };
        }));

        return NextResponse.json({
            band: band || { name: 'Unknown', slug: '' },
            codes: qrCodes,
            total: qrCodes.length,
        });

    } catch (error) {
        console.error('[QR Print] Error:', error);
        return NextResponse.json({ error: 'Failed to generate.' }, { status: 500 });
    }
}
