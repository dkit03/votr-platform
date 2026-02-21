'use client';

interface Song {
    id: string;
    title: string;
    artist: string;
    thumbnail_url?: string;
}

interface SongCardProps {
    song: Song;
    index: number;
    onSelect: () => void;
}

export function SongCard({ song, index, onSelect }: SongCardProps) {
    return (
        <button
            onClick={onSelect}
            className={`
                w-full glass-card rounded-2xl p-4 
                flex items-center gap-4
                transition-all duration-200
                hover:bg-white/10 hover:border-votr-gold/30 hover:scale-[1.02]
                active:scale-[0.98]
                animate-slide-up opacity-0
                stagger-${index + 1}
            `}
            style={{ animationFillMode: 'forwards' }}
        >
            {/* Song number / thumbnail */}
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-votr-gold/20 to-votr-red/20 flex items-center justify-center">
                {song.thumbnail_url ? (
                    <img
                        src={song.thumbnail_url}
                        alt={song.title}
                        className="w-12 h-12 rounded-xl object-cover"
                    />
                ) : (
                    <span className="text-xl">🎵</span>
                )}
            </div>

            {/* Song info */}
            <div className="flex-1 text-left min-w-0">
                <h3 className="font-semibold text-base text-white truncate">
                    {song.title}
                </h3>
                <p className="text-votr-text-muted text-sm truncate">
                    {song.artist}
                </p>
            </div>

            {/* Tap indicator */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-votr-gold/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-votr-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </button>
    );
}
