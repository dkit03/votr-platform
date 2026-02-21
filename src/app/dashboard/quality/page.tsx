'use client';

import { useEffect, useState } from 'react';

interface AnomalyFlag {
    id: string;
    flag_type: string;
    severity: string;
    details: Record<string, unknown>;
    reviewed: boolean;
    created_at: string;
}

export default function QualityPage() {
    const [anomalies, setAnomalies] = useState<AnomalyFlag[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnomalies();
    }, []);

    const loadAnomalies = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('votr_user') || '{}');
            const res = await fetch(`/api/analytics/anomalies?band_id=${user.bandId}`);
            const data = await res.json();
            if (res.ok) setAnomalies(data.anomalies || []);
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    };

    const handleReview = async (id: string) => {
        try {
            await fetch(`/api/analytics/anomalies/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewed: true }),
            });
            loadAnomalies();
        } catch { /* ignore */ }
    };

    const severityColors: Record<string, string> = {
        low: 'bg-votr-gold/10 text-votr-gold',
        medium: 'bg-orange-500/10 text-orange-400',
        high: 'bg-votr-red/10 text-votr-red',
    };

    const flagLabels: Record<string, string> = {
        multiple_devices: '📱 Multiple Devices',
        rapid_voting: '⚡ Rapid Voting',
        ip_cluster: '🌐 IP Cluster',
        suspicious_pattern: '🔍 Suspicious Pattern',
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-votr-gold border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const unreviewed = anomalies.filter(a => !a.reviewed);
    const reviewed = anomalies.filter(a => a.reviewed);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Data Quality</h1>
                <p className="text-votr-text-muted text-sm mt-1">
                    Review anomaly flags and suspicious activity
                </p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-card rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{anomalies.length}</p>
                    <p className="text-votr-text-muted text-xs">Total Flags</p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                    <p className={`text-2xl font-bold ${unreviewed.length > 0 ? 'text-votr-red' : 'text-votr-green'}`}>
                        {unreviewed.length}
                    </p>
                    <p className="text-votr-text-muted text-xs">Unreviewed</p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-votr-green">{reviewed.length}</p>
                    <p className="text-votr-text-muted text-xs">Reviewed</p>
                </div>
            </div>

            {anomalies.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                    <div className="text-4xl mb-3">✅</div>
                    <h3 className="font-bold text-white mb-1">All Clear</h3>
                    <p className="text-votr-text-muted text-sm">No anomalies detected. Your data quality is high.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Unreviewed first */}
                    {unreviewed.length > 0 && (
                        <>
                            <h3 className="text-sm font-medium text-votr-text-muted uppercase tracking-wider">
                                Needs Review ({unreviewed.length})
                            </h3>
                            {unreviewed.map(flag => (
                                <div key={flag.id} className="glass-card rounded-xl p-4 border-l-4 border-votr-red/50">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium text-white">
                                                    {flagLabels[flag.flag_type] || flag.flag_type}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${severityColors[flag.severity] || ''}`}>
                                                    {flag.severity}
                                                </span>
                                            </div>
                                            <p className="text-votr-text-muted text-xs">
                                                {(flag.details as { description?: string })?.description || JSON.stringify(flag.details)}
                                            </p>
                                            <p className="text-votr-text-muted/50 text-[10px] mt-1">
                                                {new Date(flag.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleReview(flag.id)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-votr-green/10 text-votr-green hover:bg-votr-green/20 transition-colors flex-shrink-0"
                                        >
                                            Mark Reviewed
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Reviewed */}
                    {reviewed.length > 0 && (
                        <>
                            <h3 className="text-sm font-medium text-votr-text-muted uppercase tracking-wider mt-8">
                                Reviewed ({reviewed.length})
                            </h3>
                            {reviewed.map(flag => (
                                <div key={flag.id} className="glass-card rounded-xl p-4 opacity-60">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-white">
                                            {flagLabels[flag.flag_type] || flag.flag_type}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${severityColors[flag.severity] || ''}`}>
                                            {flag.severity}
                                        </span>
                                        <span className="text-votr-green text-xs">✓ Reviewed</span>
                                    </div>
                                    <p className="text-votr-text-muted text-xs">
                                        {(flag.details as { description?: string })?.description || JSON.stringify(flag.details)}
                                    </p>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
