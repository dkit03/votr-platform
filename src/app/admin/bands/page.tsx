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

interface BandAdmin {
    id: string;
    email: string;
    role: string;
    created_at: string;
    user_id: string;
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

    // Band leader management
    const [expandedBand, setExpandedBand] = useState<string | null>(null);
    const [bandAdmins, setBandAdmins] = useState<Record<string, BandAdmin[]>>({});
    const [leaderEmail, setLeaderEmail] = useState('');
    const [addingLeader, setAddingLeader] = useState(false);
    const [leaderError, setLeaderError] = useState('');
    const [leaderSuccess, setLeaderSuccess] = useState('');

    // Edit mode
    const [editingBand, setEditingBand] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editMax, setEditMax] = useState(3000);
    const [savingEdit, setSavingEdit] = useState(false);

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

    const loadBandAdmins = async (bandId: string) => {
        try {
            const res = await fetch(`/api/admin/bands/${bandId}/admins`);
            const data = await res.json();
            if (res.ok) {
                setBandAdmins(prev => ({ ...prev, [bandId]: data.admins || [] }));
            }
        } catch { /* ignore */ }
    };

    const toggleExpand = (bandId: string) => {
        if (expandedBand === bandId) {
            setExpandedBand(null);
        } else {
            setExpandedBand(bandId);
            setLeaderEmail('');
            setLeaderError('');
            setLeaderSuccess('');
            if (!bandAdmins[bandId]) {
                loadBandAdmins(bandId);
            }
        }
    };

    const handleAddLeader = async (bandId: string) => {
        if (!leaderEmail.trim()) return;
        setAddingLeader(true);
        setLeaderError('');
        setLeaderSuccess('');

        try {
            const res = await fetch(`/api/admin/bands/${bandId}/admins`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: leaderEmail.trim().toLowerCase() }),
            });
            const data = await res.json();
            if (res.ok) {
                setLeaderSuccess(`✅ ${leaderEmail} added as band leader`);
                setLeaderEmail('');
                loadBandAdmins(bandId);
            } else {
                setLeaderError(data.error || 'Failed to add leader.');
            }
        } catch {
            setLeaderError('Network error. Please try again.');
        } finally {
            setAddingLeader(false);
        }
    };

    const handleRemoveLeader = async (bandId: string, adminId: string, adminEmail: string) => {
        if (!confirm(`Remove ${adminEmail} as band leader?`)) return;

        try {
            const res = await fetch(`/api/admin/bands/${bandId}/admins?admin_id=${adminId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                loadBandAdmins(bandId);
            }
        } catch { /* ignore */ }
    };

    const startEdit = (band: Band) => {
        setEditingBand(band.id);
        setEditName(band.name);
        setEditEmail(band.contact_email || '');
        setEditPhone(band.contact_phone || '');
        setEditMax(band.max_masqueraders);
    };

    const cancelEdit = () => {
        setEditingBand(null);
    };

    const handleSaveEdit = async (bandId: string) => {
        setSavingEdit(true);
        try {
            const res = await fetch(`/api/admin/bands/${bandId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName,
                    contact_email: editEmail || null,
                    contact_phone: editPhone || null,
                    max_masqueraders: editMax,
                }),
            });
            if (res.ok) {
                setBands(prev => prev.map(b => b.id === bandId ? {
                    ...b,
                    name: editName,
                    contact_email: editEmail || null,
                    contact_phone: editPhone || null,
                    max_masqueraders: editMax,
                } : b));
                setEditingBand(null);
            }
        } catch { /* ignore */ } finally {
            setSavingEdit(false);
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
                        {editingBand === band.id ? (
                            /* EDIT MODE */
                            <>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] text-votr-text-muted mb-1">Band Name</label>
                                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-votr-dark border border-votr-dark-border text-white text-sm focus:outline-none focus:border-votr-purple" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] text-votr-text-muted mb-1">Contact Email</label>
                                            <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg bg-votr-dark border border-votr-dark-border text-white text-sm focus:outline-none focus:border-votr-purple" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-votr-text-muted mb-1">Phone</label>
                                            <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg bg-votr-dark border border-votr-dark-border text-white text-sm focus:outline-none focus:border-votr-purple" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-votr-text-muted mb-1">Max Masqueraders</label>
                                        <input type="number" value={editMax} onChange={e => setEditMax(parseInt(e.target.value) || 0)}
                                            className="w-32 px-3 py-2 rounded-lg bg-votr-dark border border-votr-dark-border text-white text-sm focus:outline-none focus:border-votr-purple" />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2 border-t border-votr-dark-border">
                                    <button onClick={() => handleSaveEdit(band.id)} disabled={savingEdit}
                                        className="px-4 py-1.5 rounded-lg bg-votr-green/10 text-votr-green text-xs font-medium hover:bg-votr-green/20 disabled:opacity-50">
                                        {savingEdit ? 'Saving...' : '✓ Save'}
                                    </button>
                                    <button onClick={cancelEdit}
                                        className="px-4 py-1.5 rounded-lg bg-white/5 text-votr-text-muted text-xs font-medium hover:bg-white/10">
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* VIEW MODE */
                            <>
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
                                    <button
                                        onClick={() => startEdit(band)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-votr-text-muted hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        onClick={() => toggleExpand(band.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${expandedBand === band.id
                                            ? 'bg-votr-blue/10 text-votr-blue'
                                            : 'bg-white/5 text-votr-text-muted hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        👤 {expandedBand === band.id ? 'Hide Leaders' : 'Manage Leaders'}
                                    </button>
                                    <span className="text-votr-text-muted text-[10px] ml-auto">
                                        Created {new Date(band.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </>
                        )}

                        {/* Band Leaders Section */}
                        {expandedBand === band.id && (
                            <div className="pt-3 mt-1 border-t border-votr-dark-border space-y-3 animate-slide-up">
                                <h4 className="text-sm font-bold text-votr-blue flex items-center gap-2">
                                    👤 Band Leaders
                                    <span className="text-[10px] text-votr-text-muted font-normal">
                                        (can log in to see this band&apos;s dashboard)
                                    </span>
                                </h4>

                                {/* Current leaders list */}
                                {bandAdmins[band.id]?.length > 0 ? (
                                    <div className="space-y-2">
                                        {bandAdmins[band.id].map(admin => (
                                            <div key={admin.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-votr-dark/50">
                                                <div className="w-7 h-7 rounded-full bg-votr-blue/20 flex items-center justify-center text-xs">
                                                    👤
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white truncate">{admin.email}</p>
                                                    <p className="text-[10px] text-votr-text-muted capitalize">
                                                        {admin.role} · Added {new Date(admin.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveLeader(band.id, admin.id, admin.email)}
                                                    className="px-2 py-1 rounded-md text-[10px] text-votr-red/70 hover:text-votr-red hover:bg-votr-red/10 transition-colors"
                                                    title="Remove leader"
                                                >
                                                    ✕ Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-votr-text-muted/60 italic">
                                        No band leaders added yet. Add one below.
                                    </p>
                                )}

                                {/* Add leader form */}
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={leaderEmail}
                                        onChange={e => { setLeaderEmail(e.target.value); setLeaderError(''); setLeaderSuccess(''); }}
                                        placeholder="bandleader@example.com"
                                        className="flex-1 px-3 py-2 rounded-lg bg-votr-dark border border-votr-dark-border text-white text-sm placeholder-votr-text-muted/40 focus:outline-none focus:border-votr-blue transition-colors"
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddLeader(band.id); } }}
                                    />
                                    <button
                                        onClick={() => handleAddLeader(band.id)}
                                        disabled={addingLeader || !leaderEmail.trim()}
                                        className="px-4 py-2 rounded-lg bg-votr-blue/10 text-votr-blue text-sm font-medium transition-all hover:bg-votr-blue/20 disabled:opacity-40"
                                    >
                                        {addingLeader ? '...' : '+ Add'}
                                    </button>
                                </div>

                                {/* Feedback messages */}
                                {leaderError && (
                                    <p className="text-xs text-votr-red">{leaderError}</p>
                                )}
                                {leaderSuccess && (
                                    <p className="text-xs text-votr-green">{leaderSuccess}</p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
