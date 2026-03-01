'use client';

import { useEffect, useState } from 'react';

interface Band {
    id: string;
    name: string;
}

interface Section {
    id: string;
    name: string;
    band_id: string;
}

interface SectionAnalytics {
    sectionId: string;
    sectionName: string;
    totalQr: number;
    totalVotes: number;
    participationRate: number;
    topSong: { title: string; artist: string; votes: number } | null;
}

export default function AdminSectionsPage() {
    const [bands, setBands] = useState<Band[]>([]);
    const [selectedBand, setSelectedBand] = useState('');
    const [sections, setSections] = useState<Section[]>([]);
    const [analytics, setAnalytics] = useState<SectionAnalytics[]>([]);
    const [loading, setLoading] = useState(true);

    // Create section
    const [newSectionName, setNewSectionName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadBands();
    }, []);

    useEffect(() => {
        if (selectedBand) {
            loadSections();
            loadAnalytics();
        }
    }, [selectedBand]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadBands = async () => {
        try {
            const res = await fetch('/api/admin/bands');
            const data = await res.json();
            if (res.ok && data.bands?.length > 0) {
                setBands(data.bands);
                setSelectedBand(data.bands[0].id);
            }
        } catch { /* ignore */ } finally { setLoading(false); }
    };

    const loadSections = async () => {
        try {
            const res = await fetch(`/api/sections?band_id=${selectedBand}`);
            const data = await res.json();
            if (res.ok) setSections(data.sections || []);
        } catch { /* ignore */ }
    };

    const loadAnalytics = async () => {
        try {
            const res = await fetch(`/api/analytics/sections?band_id=${selectedBand}`);
            const data = await res.json();
            if (res.ok) setAnalytics(data.sections || []);
        } catch { /* ignore */ }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSectionName.trim()) return;
        setCreating(true);
        try {
            const res = await fetch('/api/sections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bandId: selectedBand, name: newSectionName.trim() }),
            });
            if (res.ok) {
                setNewSectionName('');
                loadSections();
                loadAnalytics();
            }
        } catch { /* ignore */ } finally { setCreating(false); }
    };

    const handleDelete = async (section: Section) => {
        if (!confirm(`Delete section "${section.name}"? QR codes in this section will become unassigned.`)) return;
        try {
            const res = await fetch(`/api/sections?id=${section.id}`, { method: 'DELETE' });
            if (res.ok) {
                loadSections();
                loadAnalytics();
            }
        } catch { /* ignore */ }
    };

    if (loading && bands.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-votr-purple border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Sections</h1>
                <p className="text-votr-text-muted text-sm mt-1">
                    Create and manage band sections, view engagement breakdown
                </p>
            </div>

            {/* Band Selector */}
            <div className="flex items-center gap-3">
                <label className="text-sm text-votr-text-muted">Band:</label>
                <select
                    value={selectedBand}
                    onChange={e => setSelectedBand(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-votr-dark border border-votr-dark-border text-white text-sm focus:outline-none focus:border-votr-purple"
                >
                    {bands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
            </div>

            {/* Create Section */}
            <form onSubmit={handleCreate} className="glass-card rounded-2xl p-5 border-l-4 border-votr-purple">
                <h3 className="font-bold mb-3">➕ Add Section</h3>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={newSectionName}
                        onChange={e => setNewSectionName(e.target.value)}
                        placeholder="e.g. Front Line, Back Line, VIP, Truck..."
                        required
                        className="flex-1 px-4 py-2.5 rounded-xl bg-votr-dark border border-votr-dark-border text-white text-sm focus:outline-none focus:border-votr-purple"
                    />
                    <button
                        type="submit"
                        disabled={creating || !newSectionName.trim()}
                        className="px-5 py-2.5 rounded-xl bg-votr-purple text-white font-bold text-sm disabled:opacity-50 transition-all hover:scale-[1.02]"
                    >
                        {creating ? 'Adding...' : 'Add'}
                    </button>
                </div>
            </form>

            {/* Existing Sections */}
            <div className="space-y-3">
                <h3 className="font-bold text-sm text-votr-text-muted">
                    {sections.length} section{sections.length !== 1 ? 's' : ''} for {bands.find(b => b.id === selectedBand)?.name}
                </h3>

                {sections.length === 0 ? (
                    <div className="glass-card rounded-2xl p-8 text-center">
                        <p className="text-votr-text-muted">No sections created yet. Add sections above to organize masqueraders.</p>
                    </div>
                ) : (
                    sections.map(section => {
                        const stats = analytics.find(a => a.sectionId === section.id);
                        return (
                            <div key={section.id} className="glass-card rounded-2xl p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-votr-purple/10 flex items-center justify-center text-sm">
                                            👥
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">{section.name}</h3>
                                            <p className="text-votr-text-muted text-xs">
                                                {stats ? `${stats.totalQr} masqueraders · ${stats.totalVotes} votes` : 'No data yet'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {stats && (
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-votr-purple">
                                                    {stats.participationRate}%
                                                </p>
                                                <p className="text-votr-text-muted text-[10px]">participation</p>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleDelete(section)}
                                            className="px-2 py-1 rounded-lg text-xs text-votr-red/60 hover:text-votr-red hover:bg-votr-red/10 transition-colors"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                {stats && stats.participationRate > 0 && (
                                    <div className="h-2 rounded-full bg-votr-dark overflow-hidden mb-3">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-votr-purple/60 to-votr-purple transition-all duration-700"
                                            style={{ width: `${stats.participationRate}%` }}
                                        />
                                    </div>
                                )}

                                {stats?.topSong && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-votr-text-muted">Top pick:</span>
                                        <span className="text-white font-medium">{stats.topSong.title}</span>
                                        <span className="text-votr-text-muted">
                                            by {stats.topSong.artist} ({stats.topSong.votes} votes)
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
