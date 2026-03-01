'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface UserInfo {
    id: string;
    email: string;
    role: string;
}

const navItems = [
    { href: '/admin', label: 'Platform Overview', icon: '🌐' },
    { href: '/admin/bands', label: 'Bands', icon: '🎭' },
    { href: '/admin/songs', label: 'Song Library', icon: '🎵' },
    { href: '/admin/qr-codes', label: 'QR Codes', icon: '📱' },
    { href: '/admin/sections', label: 'Sections', icon: '👥' },
    { href: '/admin/sections/assign', label: 'Assign Sections', icon: '📋' },
    { href: '/admin/health', label: 'Platform Health', icon: '💚' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('votr_user');
        if (!stored) {
            router.push('/login');
            return;
        }
        const parsed = JSON.parse(stored);
        if (parsed.role !== 'platform_admin' && parsed.role !== 'super_admin' && parsed.role !== 'admin') {
            router.push('/dashboard');
            return;
        }
        setUser(parsed);
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('votr_session');
        localStorage.removeItem('votr_user');
        router.push('/login');
    };

    if (!user) {
        return (
            <div className="min-h-dvh flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-votr-purple border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-dvh flex">
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-votr-dark-card border-r border-votr-dark-border flex flex-col
                transform transition-transform duration-200
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-6 border-b border-votr-dark-border">
                    <Link href="/admin" className="flex items-center gap-2">
                        <Image
                            src="/icons/logo-full.png"
                            alt="VOTR"
                            width={100}
                            height={44}
                        />
                    </Link>
                    <p className="text-votr-text-muted text-xs mt-2">
                        Platform Admin
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider bg-votr-purple/10 text-votr-purple">
                            Super
                        </span>
                    </p>
                </div>

                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                                    ${isActive
                                        ? 'bg-votr-purple/10 text-votr-purple'
                                        : 'text-votr-text-muted hover:bg-white/5 hover:text-white'
                                    }
                                `}
                            >
                                <span className="text-base">{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}

                    <div className="pt-4 mt-4 border-t border-votr-dark-border">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-votr-text-muted hover:bg-white/5 hover:text-white transition-all"
                        >
                            <span className="text-base">↩️</span>
                            Band Dashboard
                        </Link>
                    </div>
                </nav>

                <div className="p-4 border-t border-votr-dark-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-votr-purple/20 flex items-center justify-center text-sm">
                            🛡️
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.email}</p>
                            <p className="text-xs text-votr-text-muted">Platform Admin</p>
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

            <div className="flex-1 flex flex-col min-w-0">
                <header className="lg:hidden flex items-center justify-between p-4 border-b border-votr-dark-border bg-votr-dark-card">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-white/5 text-votr-text-muted"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <Image src="/icons/logo-full.png" alt="VOTR Admin" width={80} height={35} />
                    <div className="w-9" />
                </header>
                <main className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
