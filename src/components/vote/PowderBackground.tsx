'use client';

import { useEffect, useState } from 'react';

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    duration: number;
    delay: number;
}

export function PowderBackground() {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const colors = [
            'rgba(255, 184, 0, 0.15)',   // Gold
            'rgba(255, 51, 102, 0.12)',   // Red
            'rgba(0, 212, 255, 0.10)',    // Blue
            'rgba(139, 92, 246, 0.10)',   // Purple
            'rgba(16, 185, 129, 0.08)',   // Green
        ];

        const generated: Particle[] = Array.from({ length: 20 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 60 + Math.random() * 200,
            color: colors[i % colors.length],
            duration: 8 + Math.random() * 12,
            delay: Math.random() * 5,
        }));

        setParticles(generated);
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {/* Gradient base */}
            <div className="absolute inset-0 bg-gradient-to-b from-votr-dark via-votr-dark to-[#0D1225]" />

            {/* Floating powder particles */}
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute rounded-full animate-powder"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        background: `radial-gradient(circle, ${p.color}, transparent 70%)`,
                        animationDuration: `${p.duration}s`,
                        animationDelay: `${p.delay}s`,
                        filter: 'blur(30px)',
                    }}
                />
            ))}

            {/* Subtle top gradient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-votr-gold/5 to-transparent rounded-full blur-3xl" />
        </div>
    );
}
