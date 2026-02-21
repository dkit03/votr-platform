import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/auth/verify — verifies OTP and returns session info
export async function POST(req: NextRequest) {
    try {
        const { email, token } = await req.json();

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

        if (verifyError || !authData.session) {
            return NextResponse.json(
                { error: 'Invalid or expired verification code.', code: 'INVALID_OTP' },
                { status: 401 }
            );
        }

        const userId = authData.user?.id;

        // Check user role
        const { data: platformAdmin } = await supabase
            .from('platform_admins')
            .select('id, role')
            .eq('user_id', userId)
            .single();

        if (platformAdmin) {
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

        const { data: bandAdmin } = await supabase
            .from('band_admins')
            .select('id, band_id, role, bands(name, slug, tier, logo_url, colors_json)')
            .eq('user_id', userId)
            .single();

        if (bandAdmin) {
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

        return NextResponse.json(
            { error: 'Account not found.', code: 'NO_ACCOUNT' },
            { status: 403 }
        );

    } catch (error) {
        console.error('[Auth] Verify error:', error);
        return NextResponse.json(
            { error: 'Something went wrong.', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}
