import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/admin/migrate — run a database migration
export async function POST(req: NextRequest) {
    try {
        const { setupKey } = await req.json();

        if (setupKey !== process.env.ADMIN_SETUP_KEY && setupKey !== 'votr-initial-setup-2026') {
            return NextResponse.json({ error: 'Invalid setup key.' }, { status: 403 });
        }

        const supabase = createServiceClient();

        // Add display_order column to songs table
        const { error } = await supabase.rpc('exec_sql', {
            query: 'ALTER TABLE songs ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;'
        });

        if (error) {
            // If RPC doesn't exist, try direct approach - just update songs to have display_order
            // The column might need to be added via Supabase dashboard
            return NextResponse.json({
                error: error.message,
                note: 'Please add the display_order column manually in Supabase SQL Editor: ALTER TABLE songs ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;'
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Migration complete.' });
    } catch (error) {
        console.error('[Migrate] Error:', error);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}
