import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/analytics/anomalies?band_id=xxx
export async function GET(req: NextRequest) {
    try {
        const bandId = req.nextUrl.searchParams.get('band_id');
        if (!bandId) {
            return NextResponse.json({ error: 'band_id required.' }, { status: 400 });
        }

        const supabase = createServiceClient();

        const { data: anomalies, error } = await supabase
            .from('anomaly_flags')
            .select('*')
            .eq('band_id', bandId)
            .order('reviewed', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: 'Failed to load anomalies.' }, { status: 500 });
        }

        return NextResponse.json({ anomalies: anomalies || [] });
    } catch (error) {
        console.error('[Anomalies API] Error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}
