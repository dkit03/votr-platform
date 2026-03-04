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
            errorStatus: verifyError?.status,
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

        // Check user role - platform admin first
        console.log('[Auth Verify] Looking up platform_admins for user_id:', userId);
        const { data: platformAdmin, error: platErr } = await supabase
            .from('platform_admins')
            .select('id, role')
            .eq('user_id', userId)
            .single();

        console.log('[Auth Verify] Platform admin lookup:', { found: !!platformAdmin, data: platformAdmin, error: platErr?.message });

        if (platformAdmin) {
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

        // Check band admin by user_id
        console.log('[Auth Verify] Looking up band_admins for user_id:', userId);
        const { data: bandAdmin, error: bandErr } = await supabase
            .from('band_admins')
            .select('id, band_id, role, bands(name, slug, tier, logo_url, colors_json)')
            .eq('user_id', userId)
            .single();

        console.log('[Auth Verify] Band admin lookup by user_id:', { found: !!bandAdmin, data: bandAdmin, error: bandErr?.message });

        // Also check by email as a fallback diagnostic
        const { data: bandAdminByEmail } = await supabase
            .from('band_admins')
            .select('id, band_id, role, user_id, email')
            .eq('email', email)
            .single();

        console.log('[Auth Verify] Band admin lookup by email (diagnostic):', {
            found: !!bandAdminByEmail,
            data: bandAdminByEmail,
            storedUserId: bandAdminByEmail?.user_id,
            authUserId: userId,
            userIdMatch: bandAdminByEmail?.user_id === userId,
        });

        if (bandAdmin) {
            console.log('[Auth Verify] ✅ User is band_admin');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const band: any = bandAdmin.bands;
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
                    bandName: band?.name,
                    bandSlug: band?.slug,
                    bandTier: band?.tier,
                    bandLogo: band?.logo_url,
                    bandColors: band?.colors_json,
                },
            });
        }

        // If we found by email but not by user_id, auto-fix the user_id mismatch
        if (bandAdminByEmail && bandAdminByEmail.user_id !== userId) {
            console.log('[Auth Verify] ⚠️ USER ID MISMATCH DETECTED! Fixing...');
            console.log('[Auth Verify] Stored user_id:', bandAdminByEmail.user_id, '| Auth user_id:', userId);

            const { error: updateError } = await supabase
                .from('band_admins')
                .update({ user_id: userId })
                .eq('id', bandAdminByEmail.id);

            if (!updateError) {
                console.log('[Auth Verify] ✅ Fixed user_id mismatch. Re-fetching band admin...');
                const { data: fixedAdmin } = await supabase
                    .from('band_admins')
                    .select('id, band_id, role, bands(name, slug, tier, logo_url, colors_json)')
                    .eq('id', bandAdminByEmail.id)
                    .single();

                if (fixedAdmin) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const band: any = fixedAdmin.bands;
                    return NextResponse.json({
                        success: true,
                        session: {
                            access_token: authData.session.access_token,
                            refresh_token: authData.session.refresh_token,
                        },
                        user: {
                            id: userId,
                            email,
                            role: fixedAdmin.role,
                            bandId: fixedAdmin.band_id,
                            bandName: band?.name,
                            bandSlug: band?.slug,
                            bandTier: band?.tier,
                            bandLogo: band?.logo_url,
                            bandColors: band?.colors_json,
                        },
                    });
                }
            } else {
                console.error('[Auth Verify] ❌ Failed to fix user_id:', updateError.message);
            }
        }

        console.log('[Auth Verify] ❌ No matching account found for user_id:', userId, 'or email:', email);
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

