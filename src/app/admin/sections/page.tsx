'use client';

import { useEffect, useState } from 'react';

interface Band {
    id: string;
    name: string;
}

interface SectionData {
    sectionId: string;
    sectionName: string;
    totalQr: number;
    totalVotes: number;
    participationRate: number;
    topSong: { title: string; artist: string; votes: number } | null;
}

export default function AdminSectionsPage() {
    const [sections, setSections] = useState<SectionData[]>([]);
    const [bands, setBands] = useState<Band[]>([]);
    const [selectedBand, setSelectedBand] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBands();
    }, []);

    useEffect(() => {
        if (selectedBand) loadSections();
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
        setLoading(true);
        try {
            const res = await fetch(`/api/analytics/sections?band_id=${selectedBand}`);
            const data = await res.json();
            if (res.ok) setSections(data.sections || []);
        } catch { /* ignore */ } finally { setLoading(false); }
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
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Section Breakdown</h1>
                    <p className="text-votr-text-muted text-sm mt-1">
                        Compare engagement across band sections
                    </p>
                </div>
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

            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="w-8 h-8 border-2 border-votr-purple border-t-transparent rounded-full animate-spin" />
                </div>
            ) : sections.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                    <p className="text-votr-text-muted">No section data available yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sections.map((section, index) => (
                        <div key={section.sectionId} className="glass-card rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-votr-purple/10 flex items-center justify-center text-sm font-mono text-votr-purple">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{section.sectionName}</h3>
                                        <p className="text-votr-text-muted text-xs">
                                            {section.totalQr} masqueraders · {section.totalVotes} votes
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-votr-purple">
                                        {section.participationRate}%
                                    </p>
                                    <p className="text-votr-text-muted text-xs">participation</p>
                                </div>
                            </div>

                            <div className="h-2 rounded-full bg-votr-dark overflow-hidden mb-3">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-votr-purple/60 to-votr-purple transition-all duration-700"
                                    style={{ width: `${section.participationRate}%` }}
                                />
                            </div>

                            {section.topSong && (
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-votr-text-muted">Top pick:</span>
                                    <span className="text-white font-medium">{section.topSong.title}</span>
                                    <span className="text-votr-text-muted">
                                        by {section.topSong.artist} ({section.topSong.votes} votes)
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
