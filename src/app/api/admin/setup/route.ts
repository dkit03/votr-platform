import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/admin/setup — One-time setup to create a platform admin
// This endpoint should be removed or secured after initial setup
export async function POST(req: NextRequest) {
    try {
        const { email, setupKey } = await req.json();

        // Simple protection — require a setup key matching an env var or hardcoded for first use
        if (setupKey !== process.env.ADMIN_SETUP_KEY && setupKey !== 'votr-initial-setup-2026') {
            return NextResponse.json({ error: 'Invalid setup key.' }, { status: 403 });
        }

        if (!email) {
            return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
        }

        const supabase = createServiceClient();

        // Check if platform_admin already exists for this email
        const { data: existing } = await supabase
            .from('platform_admins')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            return NextResponse.json({
                message: 'Platform admin already exists for this email.',
                adminId: existing.id,
            });
        }

        // Check if there's already a Supabase auth user with this email
        const { data: userList } = await supabase.auth.admin.listUsers();
        let userId: string | null = null;

        if (userList?.users) {
            const existingUser = userList.users.find(u => u.email === email);
            if (existingUser) {
                userId = existingUser.id;
            }
        }

        // If no auth user exists, create one
        if (!userId) {
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email,
                email_confirm: true,
            });

            if (createError) {
                return NextResponse.json(
                    { error: `Failed to create auth user: ${createError.message}` },
                    { status: 500 }
                );
            }
            userId = newUser.user.id;
        }

        // Create platform_admins record
        const { data: admin, error: insertError } = await supabase
            .from('platform_admins')
            .insert({
                user_id: userId,
                email,
                role: 'super_admin',
            })
            .select()
            .single();

        if (insertError) {
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Platform admin created for ${email}. You can now log in at /login.`,
            admin,
        }, { status: 201 });

    } catch (error) {
        console.error('[Admin Setup] Error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}
