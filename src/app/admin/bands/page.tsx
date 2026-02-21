'use client';

import { useEffect, useState } from 'react';

interface Band {
    id: string;
    name: string;
    slug: string;
    tier: string;
    is_active: boolean;
    contact_email: string | null;
    contact_phone: string | null;
    voting_opens_at: string | null;
    voting_closes_at: string | null;
    max_masqueraders: number;
    created_at: string;
}

export default function AdminBandsPage() {
    const [bands, setBands] = useState<Band[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    // Create form
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [tier, setTier] = useState('starter');
    const [email, setEmail] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => { loadBands(); }, []);

    const loadBands = async () => {
        try {
            const res = await fetch('/api/admin/bands');
            const data = await res.json();
            if (res.ok) setBands(data.bands || []);
        } catch { /* ignore */ } finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch('/api/admin/bands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, slug, tier, contactEmail: email }),
            });
            const data = await res.json();
            if (res.ok) {
                setBands(prev => [data.band, ...prev]);
                setShowCreate(false);
                setName(''); setSlug(''); setTier('starter'); setEmail('');
            } else {
                alert(data.error);
            }
        } catch { alert('Failed to create band.'); }
        finally { setCreating(false); }
    };

    const handleToggle = async (band: Band) => {
        const res = await fetch(`/api/admin/bands/${band.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !band.is_active }),
        });
        if (res.ok) {
            setBands(prev => prev.map(b => b.id === band.id ? { ...b, is_active: !b.is_active } : b));
        }
    };

    const handleTierChange = async (band: Band, newTier: string) => {
        const res = await fetch(`/api/admin/bands/${band.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tier: newTier }),
        });
        if (res.ok) {
            setBands(prev => prev.map(b => b.id === band.id ? { ...b, tier: newTier } : b));
        }
    };

    const tierColors: Record<string, string> = {
        starter: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        core: 'bg-votr-gold/10 text-votr-gold border-votr-gold/20',
        pro: 'bg-votr-purple/10 text-votr-purple border-votr-purple/20',
        enterprise: 'bg-votr-green/10 text-votr-green border-votr-green/20',
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-votr-purple border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Bands</h1>
                    <p className="text-votr-text-muted text-sm mt-1">{bands.length} registered bands</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="px-4 py-2 rounded-xl bg-votr-purple text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {showCreate ? 'Cancel' : '➕ Onboard Band'}
                </button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <form onSubmit={handleCreate} className="glass-card rounded-2xl p-6 space-y-4 border-l-4 border-votr-purple">
                    <h3 className="font-bold">Onboard New Band</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-votr-text-muted mb-1">Band Name*</label>
                            <input type="text" value={name} onChange={e => { setName(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')); }}
                                required className="w-full px-4 py-3 rounded-xl bg-votr-dark border border-votr-dark-border text-white focus:outline-none focus:border-votr-purple" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-votr-text-muted mb-1">URL Slug*</label>
                            <input type="text" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                required className="w-full px-4 py-3 rounded-xl bg-votr-dark border border-votr-dark-border text-white font-mono focus:outline-none focus:border-votr-purple" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-votr-text-muted mb-1">Tier</label>
                            <select value={tier} onChange={e => setTier(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-votr-dark border border-votr-dark-border text-white focus:outline-none focus:border-votr-purple">
                                <option value="starter">Starter</option>
                                <option value="core">Core</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-votr-text-muted mb-1">Contact Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-votr-dark border border-votr-dark-border text-white focus:outline-none focus:border-votr-purple" />
                        </div>
                    </div>
                    <button type="submit" disabled={creating}
                        className="px-6 py-2.5 rounded-xl bg-votr-purple text-white font-bold text-sm disabled:opacity-50">
                        {creating ? 'Creating...' : 'Create Band'}
                    </button>
                </form>
            )}

            {/* Bands Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bands.map(band => (
                    <div key={band.id} className="glass-card rounded-2xl p-5 space-y-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${band.is_active ? 'bg-votr-green' : 'bg-votr-red'}`} />
                                    <h3 className="font-bold text-white">{band.name}</h3>
                                </div>
                                <p className="text-votr-text-muted text-xs mt-1">/{band.slug}</p>
                            </div>
                            <select
                                value={band.tier}
                                onChange={e => handleTierChange(band, e.target.value)}
                                className={`px-2 py-1 rounded-lg text-xs capitalize border ${tierColors[band.tier]} bg-transparent cursor-pointer`}
                            >
                                <option value="starter" className="bg-votr-dark">Starter</option>
                                <option value="core" className="bg-votr-dark">Core</option>
                                <option value="pro" className="bg-votr-dark">Pro</option>
                                <option value="enterprise" className="bg-votr-dark">Enterprise</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <span className="text-votr-text-muted">Email: </span>
                                <span className="text-white">{band.contact_email || '—'}</span>
                            </div>
                            <div>
                                <span className="text-votr-text-muted">Max: </span>
                                <span className="text-white">{band.max_masqueraders.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-votr-dark-border">
                            <button
                                onClick={() => handleToggle(band)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${band.is_active
                                        ? 'bg-votr-red/10 text-votr-red hover:bg-votr-red/20'
                                        : 'bg-votr-green/10 text-votr-green hover:bg-votr-green/20'
                                    }`}
                            >
                                {band.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <span className="text-votr-text-muted text-[10px] ml-auto">
                                Created {new Date(band.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
