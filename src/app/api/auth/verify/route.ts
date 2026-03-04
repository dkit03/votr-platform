import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/auth/verify — verifies OTP and returns session info
export async function POST(req: NextRequest) {
    try {
        const { email: rawEmail, token } = await req.json();
        const email = rawEmail?.trim().toLowerCase();
        console.log('[Auth Verify] === VERIFY ATTEMPT ===');
        console.log('[Auth Verify] Email:', email, '| Token:', token);

        if (!email || !token) {
            console.log('[Auth Verify] ❌ Missing fields');
            return NextResponse.json(
                { error: 'Email and verification code are required.', code: 'MISSING_FIELDS' },
                { status: 400 }
            );
        }

        const supabase = createServiceClient();

        // Verify OTP
        console.log('[Auth Verify] Calling verifyOtp...');
        const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
        });

        console.log('[Auth Verify] OTP result:', {
            hasSession: !!authData?.session,
            hasUser: !!authData?.user,
            userId: authData?.user?.id,
            userEmail: authData?.user?.email,
            error: verifyError?.message,
        });

        if (verifyError || !authData.session) {
            console.log('[Auth Verify] ❌ OTP verification failed:', verifyError?.message);
            return NextResponse.json(
                { error: 'Invalid or expired verification code.', code: 'INVALID_OTP' },
                { status: 401 }
            );
        }

        const userId = authData.user?.id;
        console.log('[Auth Verify] ✅ OTP verified. Auth user ID:', userId);

        // =============================
        // STRATEGY: Look up by EMAIL first (more reliable), then sync user_id
        // =============================

        // 1. Check platform_admins by email
        console.log('[Auth Verify] Checking platform_admins by email...');
        const { data: platformAdmin, error: platErr } = await supabase
            .from('platform_admins')
            .select('id, role, user_id, email')
            .eq('email', email)
            .single();

        console.log('[Auth Verify] Platform admin by email:', { found: !!platformAdmin, error: platErr?.message });

        if (platformAdmin) {
            // Sync user_id if mismatched
            if (platformAdmin.user_id !== userId && userId) {
                console.log('[Auth Verify] ⚠️ Fixing platform_admin user_id mismatch');
                await supabase.from('platform_admins').update({ user_id: userId }).eq('id', platformAdmin.id);
            }
            console.log('[Auth Verify] ✅ User is platform_admin');
            return NextResponse.json({
                success: true,
                session: {
                    access_token: authData.session.access_token,
                    refresh_token: authData.session.refresh_token,
                },
                user: {
                    id: userId,
                    email,
                    role: 'platform_admin',
                    bandId: null,
                    bandName: null,
                },
            });
        }

        // 2. Check band_admins by email (simple query, no joins)
        console.log('[Auth Verify] Checking band_admins by email...');
        const { data: bandAdmin, error: bandErr } = await supabase
            .from('band_admins')
            .select('id, band_id, role, user_id, email')
            .eq('email', email)
            .single();

        console.log('[Auth Verify] Band admin by email:', { found: !!bandAdmin, data: bandAdmin, error: bandErr?.message });

        if (bandAdmin) {
            // Sync user_id if mismatched
            if (bandAdmin.user_id !== userId && userId) {
                console.log('[Auth Verify] ⚠️ Fixing band_admin user_id mismatch');
                await supabase.from('band_admins').update({ user_id: userId }).eq('id', bandAdmin.id);
            }

            // Now fetch band details separately (avoids join issues)
            console.log('[Auth Verify] Fetching band details for band_id:', bandAdmin.band_id);
            const { data: band, error: bandDetailErr } = await supabase
                .from('bands')
                .select('name, slug, tier')
                .eq('id', bandAdmin.band_id)
                .single();

            console.log('[Auth Verify] Band details:', { found: !!band, data: band, error: bandDetailErr?.message });

            console.log('[Auth Verify] ✅ User is band_admin');
            return NextResponse.json({
                success: true,
                session: {
                    access_token: authData.session.access_token,
                    refresh_token: authData.session.refresh_token,
                },
                user: {
                    id: userId,
                    email,
                    role: bandAdmin.role,
                    bandId: bandAdmin.band_id,
                    bandName: band?.name || null,
                    bandSlug: band?.slug || null,
                    bandTier: band?.tier || null,
                },
            });
        }

        // 3. Fallback: check by user_id (in case email was stored differently)
        if (userId) {
            console.log('[Auth Verify] Fallback: checking band_admins by user_id:', userId);
            const { data: bandAdminById } = await supabase
                .from('band_admins')
                .select('id, band_id, role, email')
                .eq('user_id', userId)
                .single();

            if (bandAdminById) {
                const { data: band } = await supabase
                    .from('bands')
                    .select('name, slug, tier')
                    .eq('id', bandAdminById.band_id)
                    .single();

                console.log('[Auth Verify] ✅ Found band_admin by user_id fallback');
                return NextResponse.json({
                    success: true,
                    session: {
                        access_token: authData.session.access_token,
                        refresh_token: authData.session.refresh_token,
                    },
                    user: {
                        id: userId,
                        email,
                        role: bandAdminById.role,
                        bandId: bandAdminById.band_id,
                        bandName: band?.name || null,
                        bandSlug: band?.slug || null,
                        bandTier: band?.tier || null,
                    },
                });
            }
        }

        console.log('[Auth Verify] ❌ No matching account found for email:', email, 'or user_id:', userId);
        return NextResponse.json(
            { error: 'Account not found.', code: 'NO_ACCOUNT' },
            { status: 403 }
        );

    } catch (error) {
        console.error('[Auth Verify] ❌ Unexpected error:', error);
        return NextResponse.json(
            { error: 'Something went wrong.', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}
