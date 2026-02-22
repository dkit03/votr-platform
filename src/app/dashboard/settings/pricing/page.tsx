'use client';

import { useState } from 'react';

interface PricingTier {
    name: string;
    price: string;
    priceNote: string;
    features: string[];
    highlight: boolean;
    tier: string;
}

const WHATSAPP_NUMBER = '18681234567'; // Update with your real WhatsApp number

const tiers: PricingTier[] = [
    {
        name: 'Starter',
        price: 'Free',
        priceNote: 'For testing & small groups',
        tier: 'starter',
        highlight: false,
        features: [
            'Up to 500 QR codes',
            'Song leaderboard',
            'Basic analytics dashboard',
            'CSV data exports',
            'Email support',
        ],
    },
    {
        name: 'Core',
        price: '$299',
        priceNote: 'per Carnival season',
        tier: 'core',
        highlight: true,
        features: [
            'Up to 5,000 QR codes',
            'Section-level analytics',
            'Data quality monitoring',
            'PDF sponsor reports',
            'Section assignment at pickup',
            'Priority support',
        ],
    },
    {
        name: 'Pro',
        price: '$599',
        priceNote: 'per Carnival season',
        tier: 'pro',
        highlight: false,
        features: [
            'Up to 15,000 QR codes',
            'Real-time activity feed',
            'Custom branding on vote page',
            'API access for integrations',
            'Advanced anomaly detection',
            'Dedicated account manager',
        ],
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        priceNote: 'For mas camps & organizations',
        tier: 'enterprise',
        highlight: false,
        features: [
            'Unlimited QR codes',
            'Multi-band management',
            'White-label voting page',
            'Custom analytics dashboards',
            'SLA & uptime guarantee',
            'On-site technical support',
        ],
    },
];

export default function PricingPage() {
    const [currentTier] = useState(() => {
        if (typeof window !== 'undefined') {
            const user = JSON.parse(localStorage.getItem('votr_user') || '{}');
            return user.bandTier || 'starter';
        }
        return 'starter';
    });

    const handleContact = (tierName: string, tierPrice: string) => {
        const msg = encodeURIComponent(
            `Hi! I'm interested in the VOTR *${tierName}* plan (${tierPrice}). I'd like to upgrade my band. Can we discuss?`
        );
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
    };

    const tierOrder = ['starter', 'core', 'pro', 'enterprise'];
    const currentIdx = tierOrder.indexOf(currentTier);

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Plans & Pricing</h1>
                <p className="text-votr-text-muted text-sm mt-1">
                    Choose the plan that fits your band&apos;s size and needs
                </p>
            </div>

            {/* How it works */}
            <div className="glass-card rounded-2xl p-5 border-l-4 border-votr-gold">
                <p className="text-sm">
                    <span className="text-votr-gold font-bold">📱 How to upgrade:</span>{' '}
                    <span className="text-votr-text-muted">
                        Tap the upgrade button to message us on WhatsApp. We&apos;ll confirm your plan and activate
                        your features within minutes. Payment via bank transfer, Linx, or cash.
                    </span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tiers.map(tier => {
                    const tierIdx = tierOrder.indexOf(tier.tier);
                    const isCurrent = tier.tier === currentTier;
                    const isDowngrade = tierIdx < currentIdx;
                    const isUpgrade = tierIdx > currentIdx;

                    return (
                        <div
                            key={tier.name}
                            className={`glass-card rounded-2xl p-6 flex flex-col ${tier.highlight ? 'ring-2 ring-votr-gold' : ''
                                } ${isCurrent ? 'border-l-4 border-votr-green' : ''}`}
                        >
                            {tier.highlight && (
                                <span className="self-start px-2 py-0.5 rounded-full text-[10px] bg-votr-gold/10 text-votr-gold uppercase font-bold mb-3">
                                    Most Popular
                                </span>
                            )}
                            <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                            <div className="mt-2 mb-1">
                                <span className="text-3xl font-black text-white">{tier.price}</span>
                            </div>
                            <p className="text-votr-text-muted text-xs mb-4">{tier.priceNote}</p>

                            <ul className="space-y-2 flex-1 mb-6">
                                {tier.features.map(f => (
                                    <li key={f} className="flex items-start gap-2 text-sm text-votr-text-muted">
                                        <span className="text-votr-green mt-0.5">✓</span>
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {isCurrent ? (
                                <div className="w-full py-2.5 rounded-xl bg-votr-green/10 text-votr-green font-bold text-sm text-center">
                                    ✅ Current Plan
                                </div>
                            ) : isDowngrade ? (
                                <div className="w-full py-2.5 rounded-xl bg-white/5 text-votr-text-muted/40 font-bold text-sm text-center cursor-not-allowed">
                                    Included in your plan
                                </div>
                            ) : isUpgrade ? (
                                <button
                                    onClick={() => handleContact(tier.name, tier.price)}
                                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${tier.highlight
                                            ? 'bg-votr-gold text-votr-dark'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    💬 WhatsApp to Upgrade
                                </button>
                            ) : null}
                        </div>
                    );
                })}
            </div>

            {/* Payment Methods */}
            <div className="glass-card rounded-2xl p-6">
                <h3 className="font-bold mb-4">💰 Accepted Payment Methods</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                        <span className="text-2xl">🏦</span>
                        <div>
                            <p className="font-medium text-white">Bank Transfer</p>
                            <p className="text-votr-text-muted text-xs">Republic, Scotiabank, FCB, RBC</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                        <span className="text-2xl">💳</span>
                        <div>
                            <p className="font-medium text-white">Linx</p>
                            <p className="text-votr-text-muted text-xs">In-person card payment</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                        <span className="text-2xl">💵</span>
                        <div>
                            <p className="font-medium text-white">Cash</p>
                            <p className="text-votr-text-muted text-xs">In-person at your location</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ */}
            <div className="glass-card rounded-2xl p-6">
                <h3 className="font-bold mb-4">Frequently Asked Questions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {[
                        { q: 'When does the season start?', a: 'Your plan activates immediately and covers the current Carnival season (Jan–March).' },
                        { q: 'Can I upgrade mid-season?', a: 'Yes! Upgrade anytime and get access to new features instantly.' },
                        { q: 'How fast is activation?', a: 'Once we confirm payment, your plan is upgraded within minutes — usually while we\'re still on WhatsApp!' },
                        { q: 'Is there a refund policy?', a: 'Full refund within 7 days of purchase if you haven\'t generated any QR codes.' },
                    ].map(faq => (
                        <div key={faq.q}>
                            <p className="font-medium text-white">{faq.q}</p>
                            <p className="text-votr-text-muted mt-1">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
