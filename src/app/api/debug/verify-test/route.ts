import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/debug/verify-test?email=xxx — simulate the verify lookup
export async function GET(req: NextRequest) {
    try {
        const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();
        if (!email) {
            return NextResponse.json({ error: 'email param required' }, { status: 400 });
        }

        const supabase = createServiceClient();
        const results: Record<string, unknown> = { email };

        // 1. Check platform_admins by email
        const { data: platByEmail, error: platErr } = await supabase
            .from('platform_admins')
            .select('id, role, user_id, email')
            .eq('email', email)
            .single();
        results.platform_admin_by_email = { data: platByEmail, error: platErr?.message, code: platErr?.code };

        // 2. Check band_admins by email (EXACT same query as verify route)
        const { data: bandByEmail, error: bandErr } = await supabase
            .from('band_admins')
            .select('id, band_id, role, user_id, email')
            .eq('email', email)
            .single();
        results.band_admin_by_email = { data: bandByEmail, error: bandErr?.message, code: bandErr?.code };

        // 3. Check band_admins by email with ilike (case insensitive)
        const { data: bandByIlike, error: ilikeErr } = await supabase
            .from('band_admins')
            .select('id, band_id, role, user_id, email')
            .ilike('email', email)
            .single();
        results.band_admin_by_ilike = { data: bandByIlike, error: ilikeErr?.message, code: ilikeErr?.code };

        // 4. List ALL band_admins (to see what's actually in the table)
        const { data: allAdmins, error: allErr } = await supabase
            .from('band_admins')
            .select('id, band_id, role, user_id, email');
        results.all_band_admins = { data: allAdmins, error: allErr?.message };

        // 5. Check if the bands table has the expected columns
        const { data: bandsSample, error: bandsErr } = await supabase
            .from('bands')
            .select('id, name, slug, tier')
            .limit(2);
        results.bands_sample = { data: bandsSample, error: bandsErr?.message };

        // 6. Check RLS status
        const { data: rlsCheck } = await supabase.rpc('current_setting', { setting_name: 'role' }).single();
        results.current_role = rlsCheck;

        return NextResponse.json(results);
    } catch (error) {
        return NextResponse.json({ error: 'Internal error', details: String(error) }, { status: 500 });
    }
}
