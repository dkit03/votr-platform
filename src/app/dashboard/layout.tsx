'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface UserInfo {
    id: string;
    email: string;
    role: string;
    bandId: string | null;
    bandName: string | null;
    bandTier?: string;
}

const navItems = [
    { href: '/dashboard', label: 'Overview', icon: '📊', tier: 'starter' },
    { href: '/dashboard/sections', label: 'Sections', icon: '👥', tier: 'core', adminOnly: true },
    { href: '/dashboard/sections/assign', label: 'Assign Sections', icon: '📋', tier: 'core', adminOnly: true },
    { href: '/dashboard/activity', label: 'Activity', icon: '📈', tier: 'pro' },
    { href: '/dashboard/quality', label: 'Quality', icon: '🛡️', tier: 'core' },
    { href: '/dashboard/songs', label: 'Songs', icon: '🎵', tier: 'starter' },
    { href: '/dashboard/qr-codes', label: 'QR Codes', icon: '📱', tier: 'starter', adminOnly: true },
    { href: '/dashboard/exports', label: 'Exports', icon: '📥', tier: 'starter' },
    { href: '/dashboard/settings/pricing', label: 'Pricing', icon: '💎', tier: 'starter' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️', tier: 'starter', adminOnly: true },
];

const tierOrder = ['starter', 'core', 'pro', 'enterprise'];

function isTierAllowed(currentTier: string, requiredTier: string): boolean {
    return tierOrder.indexOf(currentTier) >= tierOrder.indexOf(requiredTier);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [bandReady, setBandReady] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('votr_user');
        if (!stored) {
            router.push('/login');
            return;
        }
        const parsed = JSON.parse(stored);
        setUser(parsed);

        // If user already has a bandId, they're ready immediately
        if (parsed.bandId) {
            setBandReady(true);
        }

        // Refresh band info from database (or assign first band for platform admins)
        fetch(`/api/admin/bands`)
            .then(r => r.json())
            .then(data => {
                if (!data.bands?.length) {
                    setBandReady(true);
                    return;
                }

                if (parsed.bandId) {
                    // Existing band leader — refresh name/tier
                    const band = data.bands.find((b: { id: string }) => b.id === parsed.bandId);
                    if (band) {
                        const updated = { ...parsed, bandName: band.name, bandTier: band.tier };
                        localStorage.setItem('votr_user', JSON.stringify(updated));
                        setUser(updated);
                    }
                    setBandReady(true);
                } else {
                    // Platform admin with no bandId — assign first band for dashboard views
                    const firstBand = data.bands[0];
                    const updated = { ...parsed, bandId: firstBand.id, bandName: firstBand.name, bandTier: firstBand.tier };
                    localStorage.setItem('votr_user', JSON.stringify(updated));
                    setUser(updated);
                    setBandReady(true);
                }
            })
            .catch(() => {
                setBandReady(true);
            });
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('votr_session');
        localStorage.removeItem('votr_user');
        router.push('/login');
    };

    if (!user || !bandReady) {
        return (
            <div className="min-h-dvh flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-votr-gold border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-dvh flex">
            {/* Mobile menu overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-votr-dark-card border-r border-votr-dark-border
                flex flex-col
                transform transition-transform duration-200
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Brand */}
                <div className="p-6 border-b border-votr-dark-border">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <Image
                            src="/icons/logo-full.png"
                            alt="VOTR"
                            width={100}
                            height={44}
                        />
                    </Link>
                    {user.bandName && (
                        <p className="text-votr-text-muted text-xs mt-2 truncate">
                            {user.bandName}
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider bg-votr-gold/10 text-votr-gold">
                                {user.bandTier || 'starter'}
                            </span>
                        </p>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navItems
                        .filter(item => !item.adminOnly || user.role === 'platform_admin')
                        .map((item) => {
                            const allowed = isTierAllowed(user.bandTier || 'starter', item.tier);
                            const isActive = pathname === item.href;

                            return (
                                <div key={item.href} className="relative">
                                    {allowed ? (
                                        <Link
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`
                                            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                                            ${isActive
                                                    ? 'bg-votr-gold/10 text-votr-gold'
                                                    : 'text-votr-text-muted hover:bg-white/5 hover:text-white'
                                                }
                                        `}
                                        >
                                            <span className="text-base">{item.icon}</span>
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-votr-text-muted/40 cursor-not-allowed">
                                            <span className="text-base opacity-40">{item.icon}</span>
                                            {item.label}
                                            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-votr-dark-border text-votr-text-muted/50 uppercase">
                                                {item.tier}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </nav>

                {/* User footer */}
                <div className="p-4 border-t border-votr-dark-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-votr-gold/20 flex items-center justify-center text-sm">
                            👤
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.email}</p>
                            <p className="text-xs text-votr-text-muted capitalize">{user.role.replace('_', ' ')}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full py-2 rounded-lg text-sm text-votr-text-muted hover:text-votr-red hover:bg-votr-red/10 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile header */}
                <header className="lg:hidden flex items-center justify-between p-4 border-b border-votr-dark-border bg-votr-dark-card">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-white/5 text-votr-text-muted"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <Image src="/icons/logo-full.png" alt="VOTR" width={80} height={35} />
                    <div className="w-9" />
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
