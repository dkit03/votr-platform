'use client';

import { useState } from 'react';

type ExportType = 'summary' | 'votes' | 'qr_codes';

interface ExportOption {
    type: ExportType;
    icon: string;
    title: string;
    description: string;
    tier: string;
}

const exportOptions: ExportOption[] = [
    {
        type: 'summary',
        icon: '📊',
        title: 'Engagement Summary',
        description: 'Participation rate, winning song, leaderboard — perfect for sponsor decks',
        tier: 'starter',
    },
    {
        type: 'votes',
        icon: '🗳️',
        title: 'Vote Data',
        description: 'Every vote with timestamp, song, section, and device fingerprint',
        tier: 'starter',
    },
    {
        type: 'qr_codes',
        icon: '📱',
        title: 'QR Code Report',
        description: 'All QR codes with scan/vote status, useful for operational analysis',
        tier: 'starter',
    },
];

export default function ExportsPage() {
    const [exporting, setExporting] = useState<ExportType | null>(null);

    const handleExport = async (type: ExportType) => {
        setExporting(type);
        try {
            const user = JSON.parse(localStorage.getItem('votr_user') || '{}');
            const url = `/api/analytics/export?band_id=${user.bandId}&type=${type}&format=csv`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `votr-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        } catch {
            alert('Export failed. Please try again.');
        } finally {
            setExporting(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Exports</h1>
                <p className="text-votr-text-muted text-sm mt-1">
                    Download data as CSV for sponsor reports and analysis
                </p>
            </div>

            {/* Sponsor pitch hint */}
            <div className="glass-card rounded-2xl p-5 border-l-4 border-votr-gold">
                <p className="text-sm">
                    <span className="text-votr-gold font-bold">💡 Pro Tip:</span>{' '}
                    <span className="text-votr-text-muted">
                        Use the Engagement Summary export in your sponsor presentations. Hard data like
                        &quot;89% participation rate&quot; and &quot;3,247 verified voters&quot; is far more
                        compelling than estimates.
                    </span>
                </p>
            </div>

            {/* Export Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {exportOptions.map(option => (
                    <div key={option.type} className="glass-card rounded-2xl p-6 flex flex-col">
                        <div className="text-3xl mb-3">{option.icon}</div>
                        <h3 className="font-bold text-white mb-1">{option.title}</h3>
                        <p className="text-votr-text-muted text-sm flex-1 mb-4">
                            {option.description}
                        </p>
                        <button
                            onClick={() => handleExport(option.type)}
                            disabled={exporting === option.type}
                            className="w-full py-2.5 rounded-xl bg-votr-gold/10 text-votr-gold font-medium text-sm transition-all hover:bg-votr-gold/20 active:scale-[0.98] disabled:opacity-50"
                        >
                            {exporting === option.type ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-votr-gold border-t-transparent rounded-full animate-spin" />
                                    Exporting...
                                </span>
                            ) : (
                                '📥 Download CSV'
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Coming soon */}
            <div className="glass-card rounded-2xl p-6 text-center">
                <p className="text-votr-text-muted text-sm">
                    📄 <span className="font-medium text-white">PDF Sponsor Reports</span> coming in the <span className="text-votr-gold">Core</span> tier —
                    branded, print-ready reports with charts and your band&apos;s logo
                </p>
            </div>
        </div>
    );
}
