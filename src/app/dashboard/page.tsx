'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { SongLeaderboard } from '@/components/dashboard/SongLeaderboard';
import { ActivityChart } from '@/components/dashboard/ActivityChart';

interface AnalyticsData {
    band: { name: string; tier: string };
    metrics: {
        totalQrCodes: number;
        totalVotes: number;
        participationRate: number;
        abandonmentRate: number;
        anomalyRate: number;
        dataConfidence: 'High' | 'Medium' | 'Low';
    };
    songLeaderboard: {
        songId: string;
        title: string;
        artist: string;
        votes: number;
        percentage: number;
    }[];
    activityTimeline: {
        hour: number;
        label: string;
        votes: number;
    }[];
    anomalySummary: {
        total: number;
        unreviewed: number;
    };
    winningSong: {
        title: string;
        artist: string;
        votes: number;
        percentage: number;
    } | null;
}

export default function DashboardOverviewPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('votr_user') || '{}');
            if (!user.bandId) {
                setError('No band associated with your account.');
                setLoading(false);
                return;
            }

            const res = await fetch(`/api/analytics/overview?band_id=${user.bandId}`);
            const result = await res.json();

            if (!res.ok) {
                setError(result.error || 'Failed to load analytics.');
                setLoading(false);
                return;
            }

            setData(result);
        } catch {
            setError('Failed to connect. Please try again.');
        } finally {
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

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-votr-text-muted mb-4">{error}</p>
                <button
                    onClick={() => { setLoading(true); setError(''); loadAnalytics(); }}
                    className="px-6 py-2 rounded-xl bg-votr-gold text-votr-dark font-bold"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!data) return null;

    const confidenceColors = {
        High: 'text-votr-green',
        Medium: 'text-votr-gold',
        Low: 'text-votr-red',
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                <p className="text-votr-text-muted text-sm mt-1">
                    {data.band.name} · Carnival 2027
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Participation Rate"
                    value={`${data.metrics.participationRate}%`}
                    sublabel={`${data.metrics.totalVotes} of ${data.metrics.totalQrCodes} voted`}
                    highlight
                />
                <StatCard
                    label="Total Votes"
                    value={data.metrics.totalVotes.toLocaleString()}
                    sublabel="Votes recorded"
                />
                <StatCard
                    label="QR Codes Issued"
                    value={data.metrics.totalQrCodes.toLocaleString()}
                    sublabel="Masqueraders registered"
                />
                <StatCard
                    label="Data Confidence"
                    value={data.metrics.dataConfidence}
                    sublabel={`${data.metrics.anomalyRate}% anomaly rate`}
                    valueClassName={confidenceColors[data.metrics.dataConfidence]}
                />
            </div>

            {/* Winning Song Banner */}
            {data.winningSong && (
                <div className="glass-card-selected rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="text-4xl">👑</div>
                        <div className="flex-1">
                            <p className="text-votr-text-muted text-xs uppercase tracking-wider mb-1">
                                Current Leader
                            </p>
                            <h2 className="text-xl font-bold text-votr-gold">
                                {data.winningSong.title}
                            </h2>
                            <p className="text-votr-text-muted text-sm">
                                {data.winningSong.artist} · {data.winningSong.percentage}% of votes ({data.winningSong.votes} votes)
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Song Leaderboard */}
                <div className="glass-card rounded-2xl p-6">
                    <h3 className="font-bold mb-4">Song Rankings</h3>
                    <SongLeaderboard songs={data.songLeaderboard} />
                </div>

                {/* Activity Timeline */}
                <div className="glass-card rounded-2xl p-6">
                    <h3 className="font-bold mb-4">Voting Activity (by Hour)</h3>
                    <ActivityChart timeline={data.activityTimeline} />
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    label="Abandonment Rate"
                    value={`${data.metrics.abandonmentRate}%`}
                    sublabel="Scanned but didn't vote"
                />
                <StatCard
                    label="Anomaly Flags"
                    value={data.anomalySummary.total.toString()}
                    sublabel={`${data.anomalySummary.unreviewed} unreviewed`}
                    valueClassName={data.anomalySummary.unreviewed > 0 ? 'text-votr-red' : ''}
                />
                <StatCard
                    label="Songs in Race"
                    value={data.songLeaderboard.length.toString()}
                    sublabel="Active songs"
                />
            </div>
        </div>
    );
}
