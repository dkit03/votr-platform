'use client';

import { useEffect, useState } from 'react';

interface ActivityItem {
    id: string;
    type: 'vote' | 'scan' | 'anomaly';
    description: string;
    timestamp: string;
    section?: string;
}

export default function ActivityPage() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadActivity();
    }, []);

    const loadActivity = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('votr_user') || '{}');
            if (!user.bandId) {
                setError('No band associated with your account.');
                setLoading(false);
                return;
            }

            const res = await fetch(`/api/activity?band_id=${user.bandId}&limit=100`);
            const result = await res.json();

            if (!res.ok) {
                setError(result.error || 'Failed to load activity.');
                setLoading(false);
                return;
            }

            setActivities(result.activities || []);
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
                    onClick={() => { setLoading(true); setError(''); loadActivity(); }}
                    className="px-6 py-2 rounded-xl bg-votr-gold text-votr-dark font-bold"
                >
                    Retry
                </button>
            </div>
        );
    }

    const typeIcons: Record<string, string> = {
        vote: '🗳️',
        scan: '📱',
        anomaly: '⚠️',
    };

    const typeColors: Record<string, string> = {
        vote: 'text-votr-green',
        scan: 'text-votr-blue',
        anomaly: 'text-votr-red',
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Activity Feed</h1>
                <p className="text-votr-text-muted text-sm mt-1">
                    Recent voting and scanning activity
                </p>
            </div>

            {activities.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                    <p className="text-4xl mb-4">📊</p>
                    <h3 className="font-bold text-lg mb-2">No Activity Yet</h3>
                    <p className="text-votr-text-muted text-sm">
                        Activity will appear here once masqueraders start scanning QR codes and voting.
                    </p>
                </div>
            ) : (
                <div className="glass-card rounded-2xl divide-y divide-votr-dark-border">
                    {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-4 hover:bg-white/[0.02] transition-colors">
                            <div className="text-xl mt-0.5">
                                {typeIcons[activity.type] || '📌'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${typeColors[activity.type] || 'text-white'}`}>
                                    {activity.description}
                                </p>
                                {activity.section && (
                                    <p className="text-xs text-votr-text-muted mt-0.5">
                                        Section: {activity.section}
                                    </p>
                                )}
                            </div>
                            <span className="text-xs text-votr-text-muted whitespace-nowrap">
                                {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
