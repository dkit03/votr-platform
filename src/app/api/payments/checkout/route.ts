import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Stripe price IDs — set these in env vars when you have a Stripe account
const STRIPE_PRICES: Record<string, string> = {
    core: process.env.STRIPE_PRICE_CORE || '',
    pro: process.env.STRIPE_PRICE_PRO || '',
};

// POST /api/payments/checkout — create a Stripe checkout session
export async function POST(req: NextRequest) {
    try {
        const { bandId, tier } = await req.json();

        if (!bandId || !tier) {
            return NextResponse.json({ error: 'bandId and tier required.' }, { status: 400 });
        }

        // Check if Stripe is configured
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) {
            // Stripe not configured — simulate upgrade for now
            const supabase = createServiceClient();
            await supabase
                .from('bands')
                .update({ tier, updated_at: new Date().toISOString() })
                .eq('id', bandId);

            return NextResponse.json({
                message: `Upgraded to ${tier}! (Stripe not configured — upgrade applied directly)`,
                upgraded: true,
                tier,
            });
        }

        // Stripe IS configured — create real checkout session
        const priceId = STRIPE_PRICES[tier];
        if (!priceId) {
            return NextResponse.json({ error: 'Invalid tier for checkout.' }, { status: 400 });
        }

        // Dynamic import to avoid errors if stripe isn't installed
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(stripeKey);

        const baseUrl = req.nextUrl.origin;

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${baseUrl}/dashboard/settings?upgraded=${tier}`,
            cancel_url: `${baseUrl}/dashboard/settings/pricing`,
            metadata: { bandId, tier },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('[Checkout] Error:', error);
        return NextResponse.json({ error: 'Checkout failed.' }, { status: 500 });
    }
}
