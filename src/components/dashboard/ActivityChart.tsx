interface ActivityChartProps {
    timeline: {
        hour: number;
        label: string;
        votes: number;
    }[];
}

export function ActivityChart({ timeline }: ActivityChartProps) {
    const maxVotes = Math.max(...timeline.map(t => t.votes), 1);

    // Filter to show only hours with activity or typical carnival hours (6am - 11pm)
    const relevantHours = timeline.filter(t => t.hour >= 6 && t.hour <= 23);

    if (relevantHours.every(t => t.votes === 0)) {
        return <p className="text-votr-text-muted text-sm text-center py-8">No activity yet</p>;
    }

    return (
        <div className="space-y-2">
            {/* Chart */}
            <div className="flex items-end gap-1 h-32">
                {relevantHours.map((t) => {
                    const height = t.votes > 0 ? Math.max((t.votes / maxVotes) * 100, 4) : 0;
                    const isActive = t.votes > 0;

                    return (
                        <div key={t.hour} className="flex-1 flex flex-col items-center justify-end h-full gap-1 group relative">
                            {/* Tooltip */}
                            {isActive && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-votr-dark-card border border-votr-dark-border rounded-lg px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                    {t.votes} votes
                                </div>
                            )}

                            {/* Bar */}
                            <div
                                className={`w-full rounded-t-sm transition-all duration-500 ${isActive
                                        ? 'bg-gradient-to-t from-votr-gold/60 to-votr-gold hover:from-votr-gold/80 hover:to-votr-gold'
                                        : 'bg-votr-dark-border/30'
                                    }`}
                                style={{
                                    height: isActive ? `${height}%` : '2px',
                                    minHeight: isActive ? '4px' : '2px',
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* X-axis labels */}
            <div className="flex gap-1">
                {relevantHours.map((t) => (
                    <div key={t.hour} className="flex-1 text-center">
                        <span className="text-[9px] text-votr-text-muted/60">
                            {t.hour % 3 === 0 ? t.label.replace(':00', '') : ''}
                        </span>
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div className="flex justify-between text-xs text-votr-text-muted pt-2">
                <span>
                    Peak: {(() => {
                        const peak = timeline.reduce((a, b) => a.votes > b.votes ? a : b);
                        return peak.votes > 0 ? `${peak.label} (${peak.votes} votes)` : 'N/A';
                    })()}
                </span>
                <span>
                    Total: {timeline.reduce((sum, t) => sum + t.votes, 0)} votes
                </span>
            </div>
        </div>
    );
}
