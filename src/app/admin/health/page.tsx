'use client';

import { useEffect, useState } from 'react';

interface HealthCheck {
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    detail: string;
}

interface HealthData {
    status: string;
    checks: HealthCheck[];
    metrics: Record<string, number>;
}

export default function AdminHealthPage() {
    const [health, setHealth] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    useEffect(() => { checkHealth(); }, []);

    const checkHealth = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/health');
            const data = await res.json();
            setHealth(data);
            setLastChecked(new Date());
        } catch {
            setHealth({ status: 'critical', checks: [{ name: 'API', status: 'critical', detail: 'Failed to reach health endpoint' }], metrics: {} });
        } finally {
            setLoading(false);
        }
    };

    const statusConfig = {
        healthy: { color: 'bg-votr-green', text: 'text-votr-green', label: 'All Systems Operational', icon: '✅', bg: 'bg-votr-green/5 border-votr-green/20' },
        warning: { color: 'bg-votr-gold', text: 'text-votr-gold', label: 'Needs Attention', icon: '⚠️', bg: 'bg-votr-gold/5 border-votr-gold/20' },
        critical: { color: 'bg-votr-red', text: 'text-votr-red', label: 'Issues Detected', icon: '🔴', bg: 'bg-votr-red/5 border-votr-red/20' },
    };

    const checkStatusStyles = {
        healthy: 'bg-votr-green/10 text-votr-green',
        warning: 'bg-votr-gold/10 text-votr-gold',
        critical: 'bg-votr-red/10 text-votr-red',
    };

    if (loading && !health) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-votr-purple border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!health) return null;

    const overallStatus = statusConfig[health.status as keyof typeof statusConfig] || statusConfig.critical;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Platform Health</h1>
                    <p className="text-votr-text-muted text-sm mt-1">
                        Last checked: {lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}
                    </p>
                </div>
                <button
                    onClick={checkHealth}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-votr-purple text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                    {loading ? 'Checking...' : '🔄 Re-check'}
                </button>
            </div>

            {/* Overall Status Banner */}
            <div className={`rounded-2xl p-6 border ${overallStatus.bg} flex items-center gap-4`}>
                <span className="text-3xl">{overallStatus.icon}</span>
                <div>
                    <h3 className={`font-bold text-lg ${overallStatus.text}`}>{overallStatus.label}</h3>
                    <p className="text-votr-text-muted text-sm">
                        {health.checks.filter(c => c.status === 'healthy').length} of {health.checks.length} checks passing
                    </p>
                </div>
            </div>

            {/* Health Checks */}
            <div className="space-y-3">
                {health.checks.map((check, i) => (
                    <div key={i} className="glass-card rounded-xl p-4 flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${statusConfig[check.status]?.color || 'bg-gray-500'}`} />
                        <div className="flex-1">
                            <p className="font-medium text-white text-sm">{check.name}</p>
                            <p className="text-votr-text-muted text-xs">{check.detail}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-medium ${checkStatusStyles[check.status]}`}>
                            {check.status}
                        </span>
                    </div>
                ))}
            </div>

            {/* Quick Metrics */}
            {health.metrics && Object.keys(health.metrics).length > 0 && (
                <div className="glass-card rounded-2xl p-6">
                    <h3 className="font-bold mb-4">Platform Metrics</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Bands', value: health.metrics.totalBands },
                            { label: 'Active Bands', value: health.metrics.activeBands },
                            { label: 'Total Votes', value: health.metrics.totalVotes },
                            { label: 'QR Codes', value: health.metrics.totalQr },
                            { label: 'Songs', value: health.metrics.totalSongs },
                            { label: 'Anomalies', value: health.metrics.totalAnomalies },
                            { label: 'Unreviewed', value: health.metrics.unreviewedAnomalies },
                            { label: 'Votes (24h)', value: health.metrics.recentVotes },
                        ].map(m => (
                            <div key={m.label} className="text-center p-3 rounded-xl bg-votr-dark">
                                <p className="text-xl font-bold text-white">{m.value?.toLocaleString() ?? 0}</p>
                                <p className="text-votr-text-muted text-xs mt-1">{m.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
