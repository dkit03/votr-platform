'use client';

interface AlreadyVotedProps {
    votedAt: string | null;
    bandName?: string;
}

export function AlreadyVoted({ votedAt, bandName }: AlreadyVotedProps) {
    const formattedDate = votedAt
        ? new Date(votedAt).toLocaleDateString('en-TT', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
        : null;

    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-scale-bounce">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold mb-2">
                You already voted!
            </h1>
            <p className="text-votr-text-muted mb-4 max-w-xs">
                Your Road March pick has been recorded. No take-backs! 😄
            </p>
            {formattedDate && (
                <div className="glass-card rounded-xl px-4 py-2 mb-4">
                    <p className="text-votr-text-muted text-sm">
                        Voted on {formattedDate}
                    </p>
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
