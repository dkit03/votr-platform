import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/debug/auth?email=xxx — debug auth state for a given email
export async function GET(req: NextRequest) {
    try {
        const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();
        if (!email) {
            return NextResponse.json({ error: 'email param required' }, { status: 400 });
        }

        const supabase = createServiceClient();

        // 1. Check band_admins
        const { data: bandAdmins, error: baError } = await supabase
            .from('band_admins')
            .select('id, email, user_id, band_id, role, created_at')
            .eq('email', email);

        // 2. Check all band_admins (in case email was stored differently)
        const { data: allBandAdmins } = await supabase
            .from('band_admins')
            .select('id, email, user_id, band_id, role, created_at');

        // 3. Check platform_admins
        const { data: platformAdmins, error: paError } = await supabase
            .from('platform_admins')
            .select('id, email, user_id, role, created_at')
            .eq('email', email);

        // 4. Check auth users
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const matchingAuthUser = authUsers?.users?.find(u => u.email === email);

        // 5. Check bands
        const { data: bands } = await supabase
            .from('bands')
            .select('id, name, slug, tier, is_active, created_at');

        return NextResponse.json({
            query_email: email,
            band_admins: {
                matching: bandAdmins,
                error: baError?.message,
                all_emails: allBandAdmins?.map(a => ({ id: a.id, email: a.email, user_id: a.user_id, band_id: a.band_id })),
            },
            platform_admins: {
                matching: platformAdmins,
                error: paError?.message,
            },
            auth_user: matchingAuthUser ? {
                id: matchingAuthUser.id,
                email: matchingAuthUser.email,
                created_at: matchingAuthUser.created_at,
                confirmed_at: matchingAuthUser.confirmed_at,
                email_confirmed_at: matchingAuthUser.email_confirmed_at,
            } : null,
            bands: bands?.map(b => ({ id: b.id, name: b.name, slug: b.slug })),
        });
    } catch (error) {
        console.error('[Debug] Error:', error);
        return NextResponse.json({ error: 'Internal error', details: String(error) }, { status: 500 });
    }
}
