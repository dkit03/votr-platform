import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/auth/login — sends OTP to band admin email
export async function POST(req: NextRequest) {
    try {
        const { email: rawEmail } = await req.json();
        const email = rawEmail?.trim().toLowerCase();
        console.log('[Auth Login] === LOGIN ATTEMPT ===');
        console.log('[Auth Login] Email:', email);

        if (!email) {
            console.log('[Auth Login] ❌ No email provided');
            return NextResponse.json(
                { error: 'Email is required', code: 'MISSING_EMAIL' },
                { status: 400 }
            );
        }

        const supabase = createServiceClient();

        // Check if user is a band admin or platform admin
        const { data: bandAdmin, error: bandError } = await supabase
            .from('band_admins')
            .select('id, band_id, role, user_id, bands(name)')
            .eq('email', email)
            .single();

        console.log('[Auth Login] Band admin lookup:', { found: !!bandAdmin, bandAdmin, error: bandError?.message });

        const { data: platformAdmin, error: platformError } = await supabase
            .from('platform_admins')
            .select('id, role, user_id, email')
            .eq('email', email)
            .single();

        console.log('[Auth Login] Platform admin lookup:', { found: !!platformAdmin, platformAdmin, error: platformError?.message });

        if (!bandAdmin && !platformAdmin) {
            console.log('[Auth Login] ❌ Email not found in band_admins or platform_admins');
            return NextResponse.json(
                { error: 'This email is not associated with any band or admin account.', code: 'NOT_AUTHORIZED' },
                { status: 403 }
            );
        }

        // Check existing auth user
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingAuthUser = existingUsers?.users?.find(u => u.email === email);
        console.log('[Auth Login] Existing auth user:', {
            found: !!existingAuthUser,
            authUserId: existingAuthUser?.id,
            bandAdminUserId: bandAdmin?.user_id,
            match: existingAuthUser?.id === bandAdmin?.user_id,
        });

        // Send OTP via Supabase Auth
        const { data: otpData, error: otpError } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
            },
        });

        console.log('[Auth Login] OTP send result:', { data: otpData, error: otpError?.message });

        if (otpError) {
            console.error('[Auth Login] ❌ OTP error:', otpError);
            return NextResponse.json(
                { error: 'Failed to send verification code. Please try again.', code: 'OTP_FAILED' },
                { status: 500 }
            );
        }

        console.log('[Auth Login] ✅ OTP sent successfully');
        return NextResponse.json({
            success: true,
            message: 'Verification code sent to your email.',
            userType: platformAdmin ? 'platform_admin' : 'band_admin',
        });

    } catch (error) {
        console.error('[Auth Login] ❌ Unexpected error:', error);
        return NextResponse.json(
            { error: 'Something went wrong.', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}
