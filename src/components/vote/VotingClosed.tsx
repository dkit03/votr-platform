'use client';

interface VotingClosedProps {
    bandName?: string;
    opensAt?: string | null;
    notYetOpen?: boolean;
}

export function VotingClosed({ bandName, opensAt, notYetOpen }: VotingClosedProps) {
    const formattedDate = opensAt
        ? new Date(opensAt).toLocaleDateString('en-TT', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
        : null;

    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-scale-bounce">
            <div className="text-6xl mb-4">{notYetOpen ? '⏳' : '🔒'}</div>
            <h1 className="text-2xl font-bold mb-2">
                {notYetOpen ? 'Voting opens soon!' : 'Voting has closed'}
            </h1>
            <p className="text-votr-text-muted mb-4 max-w-xs">
                {notYetOpen
                    ? 'Hold tight, reveller! The voting window hasn\'t opened yet.'
                    : 'The Road March vote is complete. Results are being tallied!'}
            </p>
            {notYetOpen && formattedDate && (
                <div className="glass-card rounded-xl px-4 py-3 mb-4">
                    <p className="text-votr-text-muted text-xs uppercase tracking-wider mb-1">Opens</p>
                    <p className="text-votr-gold font-semibold">{formattedDate}</p>
                </div>
            )}
            {bandName && (
                <p className="text-votr-text-muted text-xs">
                    🎭 {bandName} Carnival 2027
                </p>
            )}
        </div>
    );
}
