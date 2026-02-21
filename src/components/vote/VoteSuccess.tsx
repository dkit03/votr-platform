'use client';

import { useEffect, useState } from 'react';

interface VoteSuccessProps {
    song: { title: string; artist: string };
    bandName: string;
}

function ConfettiPiece({ index }: { index: number }) {
    const colors = ['#FFB800', '#FF3366', '#00D4FF', '#8B5CF6', '#10B981', '#FF6B35'];
    const color = colors[index % colors.length];
    const left = Math.random() * 100;
    const delay = Math.random() * 2;
    const size = 6 + Math.random() * 8;

    return (
        <div
            className="absolute animate-confetti"
            style={{
                left: `${left}%`,
                top: '-10px',
                animationDelay: `${delay}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
            }}
        >
            <div
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: color,
                    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                    transform: `rotate(${Math.random() * 360}deg)`,
                }}
            />
        </div>
    );
}

export function VoteSuccess({ song, bandName }: VoteSuccessProps) {
    const [showConfetti, setShowConfetti] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex-1 flex flex-col items-center justify-center relative">
            {/* Confetti */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-20">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <ConfettiPiece key={i} index={i} />
                    ))}
                </div>
            )}

            <div className="animate-scale-bounce text-center max-w-sm">
                {/* Crown */}
                <div className="text-6xl mb-4">👑</div>

                {/* Success message */}
                <h1 className="text-3xl font-bold mb-2">
                    Vote <span className="text-votr-gold">Locked!</span> 🎉
                </h1>
                <p className="text-votr-text-muted mb-8">
                    Your voice has been heard, reveller!
                </p>

                {/* Voted song card */}
                <div className="glass-card-selected rounded-2xl p-6 mb-8 animate-pulse-glow">
                    <p className="text-votr-text-muted text-xs uppercase tracking-wider mb-2">
                        You voted for
                    </p>
                    <h2 className="text-2xl font-bold text-votr-gold mb-1">
                        {song.title}
                    </h2>
                    <p className="text-votr-text-muted">
                        {song.artist}
                    </p>
                </div>

                {/* Band tag */}
                <div className="inline-block px-4 py-2 rounded-full glass-card mb-8">
                    <span className="text-sm text-votr-text-muted">
                        🎭 {bandName} Carnival 2027
                    </span>
                </div>

                {/* Social-ready message */}
                <p className="text-votr-text-muted text-xs">
                    Screenshot this and share your pick! 📸
                </p>
            </div>
        </div>
    );
}
