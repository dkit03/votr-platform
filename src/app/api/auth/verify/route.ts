import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/auth/verify — verifies OTP and returns session info
export async function POST(req: NextRequest) {
    const debugInfo: Record<string, unknown> = {};

    try {
        const { email: rawEmail, token } = await req.json();
        const email = rawEmail?.trim().toLowerCase();
        debugInfo.email = email;
        debugInfo.hasToken = !!token;

        if (!email || !token) {
            return NextResponse.json(
                { error: 'Email and verification code are required.', code: 'MISSING_FIELDS' },
                { status: 400 }
            );
        }

        const supabase = createServiceClient();

        // Verify OTP
        const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
        });

        debugInfo.otpResult = {
            hasSession: !!authData?.session,
            hasUser: !!authData?.user,
            userId: authData?.user?.id,
            error: verifyError?.message,
        };

        if (verifyError || !authData.session) {
            return NextResponse.json(
                { error: 'Invalid or expired verification code.', code: 'INVALID_OTP', debug: debugInfo },
                { status: 401 }
            );
        }

        const userId = authData.user?.id;
        debugInfo.authUserId = userId;

        // CRITICAL: Create a FRESH service client for database lookups.
        // After verifyOtp, the original client has the user's auth session,
        // which causes queries to run under user RLS context instead of service role.
        // This was causing "infinite recursion detected in policy for relation band_admins".
        const dbClient = createServiceClient();

        // 1. Check platform_admins by email (use maybeSingle to avoid PGRST116 errors)
        const { data: platformAdmin, error: platErr } = await dbClient
            .from('platform_admins')
            .select('id, role, user_id, email')
            .eq('email', email)
            .maybeSingle();

        debugInfo.platformAdmin = { found: !!platformAdmin, error: platErr?.message };

        if (platformAdmin) {
            if (platformAdmin.user_id !== userId && userId) {
                await dbClient.from('platform_admins').update({ user_id: userId }).eq('id', platformAdmin.id);
            }
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

        // 2. Check band_admins by email (use maybeSingle)
        const { data: bandAdmin, error: bandErr } = await dbClient
            .from('band_admins')
            .select('id, band_id, role, user_id, email')
            .eq('email', email)
            .maybeSingle();

        debugInfo.bandAdmin = { found: !!bandAdmin, data: bandAdmin, error: bandErr?.message };

        if (bandAdmin) {
            if (bandAdmin.user_id !== userId && userId) {
                await dbClient.from('band_admins').update({ user_id: userId }).eq('id', bandAdmin.id);
            }

            // Fetch band details separately
            const { data: band } = await dbClient
                .from('bands')
                .select('name, slug, tier')
                .eq('id', bandAdmin.band_id)
                .maybeSingle();

            debugInfo.band = { found: !!band, data: band };

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

        // 3. Fallback: check by user_id
        if (userId) {
            const { data: bandAdminById } = await dbClient
                .from('band_admins')
                .select('id, band_id, role, email')
                .eq('user_id', userId)
                .maybeSingle();

            debugInfo.bandAdminById = { found: !!bandAdminById };

            if (bandAdminById) {
                const { data: band } = await dbClient
                    .from('bands')
                    .select('name, slug, tier')
                    .eq('id', bandAdminById.band_id)
                    .maybeSingle();

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

        // Include debug info in the error response so we can see it in the browser
        return NextResponse.json(
            { error: 'Account not found.', code: 'NO_ACCOUNT', debug: debugInfo },
            { status: 403 }
        );

    } catch (error) {
        debugInfo.exception = String(error);
        return NextResponse.json(
            { error: 'Something went wrong.', code: 'INTERNAL_ERROR', debug: debugInfo },
            { status: 500 }
        );
    }
}
