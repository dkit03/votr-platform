'use client';

import { useEffect, useState } from 'react';

interface SectionData {
    sectionId: string;
    sectionName: string;
    totalQr: number;
    totalVotes: number;
    participationRate: number;
    topSong: { title: string; artist: string; votes: number } | null;
}

export default function SectionsPage() {
    const [sections, setSections] = useState<SectionData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSections();
    }, []);

    const loadSections = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('votr_user') || '{}');
            const res = await fetch(`/api/analytics/sections?band_id=${user.bandId}`);
            const data = await res.json();
            if (res.ok) setSections(data.sections || []);
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-votr-gold border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Section Breakdown</h1>
                <p className="text-votr-text-muted text-sm mt-1">
                    Compare engagement across band sections
                </p>
            </div>

            {sections.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                    <p className="text-votr-text-muted">No section data available yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sections.map((section, index) => (
                        <div key={section.sectionId} className="glass-card rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-votr-gold/10 flex items-center justify-center text-sm font-mono text-votr-gold">
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
                                    <p className="text-2xl font-bold text-votr-gold">
                                        {section.participationRate}%
                                    </p>
                                    <p className="text-votr-text-muted text-xs">participation</p>
                                </div>
                            </div>

                            {/* Participation bar */}
                            <div className="h-2 rounded-full bg-votr-dark overflow-hidden mb-3">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-votr-gold/60 to-votr-gold transition-all duration-700"
                                    style={{ width: `${section.participationRate}%` }}
                                />
                            </div>

                            {/* Top song for this section */}
                            {section.topSong && (
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-votr-text-muted">Top pick:</span>
                                    <span className="text-white font-medium">
                                        {section.topSong.title}
                                    </span>
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
