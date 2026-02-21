'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { SongLeaderboard } from '@/components/dashboard/SongLeaderboard';

interface PlatformData {
    platform: {
        totalBands: number;
        activeBands: number;
        totalQrCodes: number;
        totalVotes: number;
        totalAnomalies: number;
        totalSongs: number;
        globalParticipation: number;
        tierCounts: Record<string, number>;
    };
    bands: {
        id: string;
        name: string;
        slug: string;
        tier: string;
        is_active: boolean;
        qrCodes: number;
        votes: number;
        participationRate: number;
        unreviewedAnomalies: number;
    }[];
    globalLeaderboard: {
        songId: string;
        title: string;
        artist: string;
        votes: number;
        percentage: number;
    }[];
}

export default function AdminOverviewPage() {
    const [data, setData] = useState<PlatformData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await fetch('/api/admin/overview');
            const result = await res.json();
            if (res.ok) setData(result);
            else setError(result.error || 'Failed to load.');
        } catch { setError('Network error.'); }
        finally { setLoading(false); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-votr-purple border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-votr-text-muted mb-4">{error}</p>
                <button onClick={() => { setLoading(true); setError(''); loadData(); }}
                    className="px-6 py-2 rounded-xl bg-votr-purple text-white font-bold">Retry</button>
            </div>
        );
    }

    const tierColors: Record<string, string> = {
        starter: 'bg-gray-500/10 text-gray-400',
        core: 'bg-votr-gold/10 text-votr-gold',
        pro: 'bg-votr-purple/10 text-votr-purple',
        enterprise: 'bg-votr-green/10 text-votr-green',
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Platform Overview</h1>
                <p className="text-votr-text-muted text-sm mt-1">
                    Cross-band analytics · Carnival 2027
                </p>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Active Bands" value={data.platform.activeBands.toString()} sublabel={`of ${data.platform.totalBands} total`} highlight valueClassName="text-votr-purple" />
                <StatCard label="Total Votes" value={data.platform.totalVotes.toLocaleString()} sublabel="Across all bands" />
                <StatCard label="Global Participation" value={`${data.platform.globalParticipation}%`} sublabel={`${data.platform.totalQrCodes} QR codes issued`} />
                <StatCard label="Anomaly Flags" value={data.platform.totalAnomalies.toString()} sublabel="Across all bands" valueClassName={data.platform.totalAnomalies > 0 ? 'text-votr-gold' : ''} />
            </div>

            {/* Tier Breakdown */}
            <div className="glass-card rounded-2xl p-6">
                <h3 className="font-bold mb-4">Tier Distribution</h3>
                <div className="grid grid-cols-4 gap-3">
                    {['starter', 'core', 'pro', 'enterprise'].map(tier => (
                        <div key={tier} className="text-center p-3 rounded-xl bg-votr-dark">
                            <p className="text-2xl font-bold text-white">{data.platform.tierCounts[tier] || 0}</p>
                            <p className={`text-xs capitalize mt-1 px-2 py-0.5 rounded-full inline-block ${tierColors[tier]}`}>
                                {tier}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bands Table + Global Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bands Table */}
                <div className="lg:col-span-2 glass-card rounded-2xl p-6">
                    <h3 className="font-bold mb-4">Band Performance</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-votr-dark-border">
                                    <th className="text-left py-2 px-3 text-votr-text-muted font-medium">Band</th>
                                    <th className="text-left py-2 px-3 text-votr-text-muted font-medium">Tier</th>
                                    <th className="text-right py-2 px-3 text-votr-text-muted font-medium">QR Codes</th>
                                    <th className="text-right py-2 px-3 text-votr-text-muted font-medium">Votes</th>
                                    <th className="text-right py-2 px-3 text-votr-text-muted font-medium">Rate</th>
                                    <th className="text-right py-2 px-3 text-votr-text-muted font-medium">⚠️</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.bands.map(band => (
                                    <tr key={band.id} className="border-b border-votr-dark-border/50 hover:bg-white/[0.02]">
                                        <td className="py-3 px-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${band.is_active ? 'bg-votr-green' : 'bg-votr-red'}`} />
                                                <span className="font-medium text-white">{band.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${tierColors[band.tier]}`}>
                                                {band.tier}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-right text-votr-text-muted">{band.qrCodes}</td>
                                        <td className="py-3 px-3 text-right text-white font-medium">{band.votes}</td>
                                        <td className="py-3 px-3 text-right">
                                            <span className={band.participationRate >= 60 ? 'text-votr-green' : band.participationRate >= 30 ? 'text-votr-gold' : 'text-votr-red'}>
                                                {band.participationRate}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-right">
                                            {band.unreviewedAnomalies > 0 ? (
                                                <span className="text-votr-red font-medium">{band.unreviewedAnomalies}</span>
                                            ) : (
                                                <span className="text-votr-text-muted/40">0</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Global Song Leaderboard */}
                <div className="glass-card rounded-2xl p-6">
                    <h3 className="font-bold mb-4">🏆 Global Road March</h3>
                    <SongLeaderboard songs={data.globalLeaderboard} />
                </div>
            </div>
        </div>
    );
}
