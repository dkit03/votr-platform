import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// PATCH /api/analytics/anomalies/[id] — mark as reviewed
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        const supabase = createServiceClient();

        const { error } = await supabase
            .from('anomaly_flags')
            .update({
                reviewed: body.reviewed ?? true,
                reviewed_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: 'Failed to update.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Anomalies API] Error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}
