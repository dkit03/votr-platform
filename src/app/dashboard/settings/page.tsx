'use client';

import { useEffect, useState } from 'react';

interface UserInfo {
    bandId: string | null;
    bandName: string | null;
    bandTier?: string;
    email: string;
    role: string;
}

export default function SettingsPage() {
    const [user, setUser] = useState<UserInfo | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('votr_user');
        if (stored) setUser(JSON.parse(stored));
    }, []);

    if (!user) return null;

    const tierFeatures: Record<string, string[]> = {
        starter: ['Overview analytics', 'Song leaderboard', 'CSV exports', 'QR code management'],
        core: ['Everything in Starter', 'Section breakdown', 'Anomaly review', 'PDF sponsor reports'],
        pro: ['Everything in Core', 'Real-time activity feed', 'Custom branding', 'API access'],
        enterprise: ['Everything in Pro', 'Multi-event support', 'Dedicated support', 'Custom integrations'],
    };

    const currentTier = user.bandTier || 'starter';

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-votr-text-muted text-sm mt-1">
                    Account and band configuration
                </p>
            </div>

            {/* Band Info */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
                <h2 className="font-bold text-lg">Band Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-votr-text-muted uppercase tracking-wider mb-1">Band Name</label>
                        <p className="text-white font-medium">{user.bandName || 'N/A'}</p>
                    </div>
                    <div>
                        <label className="block text-xs text-votr-text-muted uppercase tracking-wider mb-1">Admin Email</label>
                        <p className="text-white font-medium">{user.email}</p>
                    </div>
                    <div>
                        <label className="block text-xs text-votr-text-muted uppercase tracking-wider mb-1">Role</label>
                        <p className="text-white font-medium capitalize">{user.role.replace('_', ' ')}</p>
                    </div>
                    <div>
                        <label className="block text-xs text-votr-text-muted uppercase tracking-wider mb-1">Current Tier</label>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-votr-gold/10 text-votr-gold capitalize">
                            {currentTier}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tier Comparison */}
            <div className="glass-card rounded-2xl p-6">
                <h2 className="font-bold text-lg mb-4">Plan Features</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(tierFeatures).map(([tier, features]) => {
                        const isActive = tier === currentTier;
                        return (
                            <div
                                key={tier}
                                className={`rounded-xl p-4 border ${isActive
                                    ? 'border-votr-gold bg-votr-gold/5'
                                    : 'border-votr-dark-border'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className={`font-bold capitalize ${isActive ? 'text-votr-gold' : 'text-white'}`}>
                                        {tier}
                                    </h3>
                                    {isActive && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-votr-gold/20 text-votr-gold uppercase">
                                            Current
                                        </span>
                                    )}
                                </div>
                                <ul className="space-y-2">
                                    {features.map(feature => (
                                        <li key={feature} className="flex items-start gap-2 text-xs">
                                            <span className={isActive ? 'text-votr-green' : 'text-votr-text-muted/40'}>✓</span>
                                            <span className={isActive ? 'text-votr-text-muted' : 'text-votr-text-muted/40'}>
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Upgrade CTA */}
            <div className="glass-card rounded-2xl p-6 text-center border-l-4 border-votr-purple">
                <p className="text-sm text-votr-text-muted mb-3">
                    Need more features? Upgrade your plan for section analytics, PDF reports, and more.
                </p>
                <a
                    href="/dashboard/settings/pricing"
                    className="inline-flex px-6 py-2.5 rounded-xl bg-votr-purple text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    💎 View Plans & Pricing
                </a>
            </div>
        </div>
    );
}
