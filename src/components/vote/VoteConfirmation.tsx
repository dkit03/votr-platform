'use client';

interface VoteConfirmationProps {
    song: { id: string; title: string; artist: string };
    bandColors?: { primary: string; secondary: string };
    onConfirm: () => void;
    onCancel: () => void;
}

export function VoteConfirmation({ song, bandColors, onConfirm, onCancel }: VoteConfirmationProps) {
    const primaryColor = bandColors?.primary || '#FFB800';

    return (
        <div className="flex-1 flex flex-col items-center justify-center animate-scale-bounce">
            <div className="glass-card rounded-3xl p-8 max-w-sm w-full text-center">
                {/* Song icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-votr-gold/20 to-votr-red/20 flex items-center justify-center">
                    <span className="text-4xl">🎶</span>
                </div>

                {/* Confirmation text */}
                <h2 className="text-xl font-bold mb-2">Lock in your vote?</h2>
                <p className="text-votr-text-muted text-sm mb-6">
                    This cannot be changed once submitted
                </p>

                {/* Selected song */}
                <div
                    className="rounded-xl p-4 mb-8 border-2"
                    style={{
                        borderColor: primaryColor,
                        backgroundColor: `${primaryColor}12`,
                    }}
                >
                    <h3 className="font-bold text-lg" style={{ color: primaryColor }}>
                        {song.title}
                    </h3>
                    <p className="text-votr-text-muted text-sm">{song.artist}</p>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={onConfirm}
                        className="w-full py-4 rounded-2xl font-bold text-base text-votr-dark transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        style={{ backgroundColor: primaryColor }}
                    >
                        🗳️ Confirm Vote
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full py-3 rounded-2xl font-medium text-sm text-votr-text-muted hover:text-white transition-colors"
                    >
                        Go back
                    </button>
                </div>
            </div>
        </div>
    );
}
