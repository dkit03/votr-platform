import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/admin/bands/[id]/admins — list band admins
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: bandId } = await params;
        const supabase = createServiceClient();

        const { data: admins, error } = await supabase
            .from('band_admins')
            .select('id, email, role, created_at, user_id')
            .eq('band_id', bandId)
            .order('created_at', { ascending: true });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ admins: admins || [] });
    } catch (error) {
        console.error('[Band Admins] List error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}

// POST /api/admin/bands/[id]/admins — add a band leader
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: bandId } = await params;
        const { email, role } = await req.json();
        console.log('[Band Admins] === ADD LEADER ===');
        console.log('[Band Admins] Band ID:', bandId, '| Email:', email, '| Role:', role);

        if (!email) {
            return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
        }

        const supabase = createServiceClient();

        // Check if this email is already a band admin for this band
        const { data: existing } = await supabase
            .from('band_admins')
            .select('id')
            .eq('band_id', bandId)
            .eq('email', email)
            .single();

        if (existing) {
            console.log('[Band Admins] ❌ Already exists:', existing.id);
            return NextResponse.json(
                { error: 'This email is already a leader for this band.' },
                { status: 409 }
            );
        }

        // Check if there's already a Supabase auth user with this email
        const { data: userList } = await supabase.auth.admin.listUsers();
        let userId: string | null = null;

        if (userList?.users) {
            const existingUser = userList.users.find(u => u.email === email);
            if (existingUser) {
                userId = existingUser.id;
                console.log('[Band Admins] Found existing auth user:', userId);
            }
        }

        // If no auth user exists, create one (they'll use OTP to sign in)
        if (!userId) {
            console.log('[Band Admins] No auth user found, creating one...');
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email,
                email_confirm: true, // Auto-confirm so OTP login works
            });

            if (createError) {
                console.error('[Band Admins] ❌ Auth user creation error:', createError);
                return NextResponse.json(
                    { error: `Failed to create user account: ${createError.message}` },
                    { status: 500 }
                );
            }

            userId = newUser.user.id;
            console.log('[Band Admins] ✅ Created auth user:', userId);
        }

        // Create the band_admin record
        console.log('[Band Admins] Inserting band_admin with user_id:', userId);
        const { data: admin, error: insertError } = await supabase
            .from('band_admins')
            .insert({
                user_id: userId,
                band_id: bandId,
                email,
                role: role || 'admin',
            })
            .select()
            .single();

        if (insertError) {
            console.error('[Band Admins] ❌ Insert error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        console.log('[Band Admins] ✅ Band admin created:', admin);
        return NextResponse.json({ admin }, { status: 201 });
    } catch (error) {
        console.error('[Band Admins] ❌ Create error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}

// DELETE /api/admin/bands/[id]/admins — remove a band leader
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: bandId } = await params;
        const { searchParams } = new URL(req.url);
        const adminId = searchParams.get('admin_id');

        if (!adminId) {
            return NextResponse.json({ error: 'admin_id is required.' }, { status: 400 });
        }

        const supabase = createServiceClient();

        const { error } = await supabase
            .from('band_admins')
            .delete()
            .eq('id', adminId)
            .eq('band_id', bandId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Band Admins] Delete error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}
