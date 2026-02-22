import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/payments/webhook — Stripe webhook for payment completion
export async function POST(req: NextRequest) {
    try {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!stripeKey || !webhookSecret) {
            return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
        }

        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(stripeKey);

        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const bandId = session.metadata?.bandId;
            const tier = session.metadata?.tier;

            if (bandId && tier) {
                const supabase = createServiceClient();
                await supabase
                    .from('bands')
                    .update({
                        tier,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', bandId);

                console.log(`[Webhook] Band ${bandId} upgraded to ${tier}`);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('[Webhook] Error:', error);
        return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
    }
}
