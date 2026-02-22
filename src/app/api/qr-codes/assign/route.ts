import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// PATCH /api/qr-codes/assign — assign/reassign section for QR codes
export async function PATCH(req: NextRequest) {
    try {
        const { codeString, sectionId, bandId } = await req.json();

        if (!codeString || !bandId) {
            return NextResponse.json({ error: 'codeString and bandId required.' }, { status: 400 });
        }

        const supabase = createServiceClient();

        // Find the QR code
        const { data: qr, error: findError } = await supabase
            .from('qr_codes')
            .select('id, code_string, voted, section_id, sections(name)')
            .eq('code_string', codeString)
            .eq('band_id', bandId)
            .single();

        if (findError || !qr) {
            return NextResponse.json({ error: 'QR code not found.' }, { status: 404 });
        }

        if (qr.voted) {
            return NextResponse.json({ error: 'Cannot reassign — this code has already been used to vote.' }, { status: 409 });
        }

        // Update section
        const { data: updated, error: updateError } = await supabase
            .from('qr_codes')
            .update({ section_id: sectionId || null })
            .eq('id', qr.id)
            .select('id, code_string, section_id, sections(name)')
            .single();

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ qrCode: updated });
    } catch (error) {
        console.error('[QR Assign] Error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}
