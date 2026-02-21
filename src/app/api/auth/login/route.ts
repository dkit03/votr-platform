import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/auth/login — sends OTP to band admin email
export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required', code: 'MISSING_EMAIL' },
                { status: 400 }
            );
        }

        const supabase = createServiceClient();

        // Check if user is a band admin or platform admin
        const { data: bandAdmin } = await supabase
            .from('band_admins')
            .select('id, band_id, role, bands(name)')
            .eq('email', email)
            .single();

        const { data: platformAdmin } = await supabase
            .from('platform_admins')
            .select('id, role')
            .eq('email', email)
            .single();

        if (!bandAdmin && !platformAdmin) {
            return NextResponse.json(
                { error: 'This email is not associated with any band or admin account.', code: 'NOT_AUTHORIZED' },
                { status: 403 }
            );
        }

        // Send OTP via Supabase Auth
        const { error: otpError } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
            },
        });

        if (otpError) {
            console.error('[Auth] OTP error:', otpError);
            return NextResponse.json(
                { error: 'Failed to send verification code. Please try again.', code: 'OTP_FAILED' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Verification code sent to your email.',
            userType: platformAdmin ? 'platform_admin' : 'band_admin',
        });

    } catch (error) {
        console.error('[Auth] Login error:', error);
        return NextResponse.json(
            { error: 'Something went wrong.', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}
