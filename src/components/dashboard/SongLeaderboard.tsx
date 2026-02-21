interface SongLeaderboardProps {
    songs: {
        songId: string;
        title: string;
        artist: string;
        votes: number;
        percentage: number;
    }[];
}

export function SongLeaderboard({ songs }: SongLeaderboardProps) {
    if (songs.length === 0) {
        return <p className="text-votr-text-muted text-sm text-center py-8">No votes yet</p>;
    }

    const medals = ['🥇', '🥈', '🥉'];

    return (
        <div className="space-y-3">
            {songs.map((song, index) => (
                <div key={song.songId} className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-8 text-center">
                        {index < 3 ? (
                            <span className="text-lg">{medals[index]}</span>
                        ) : (
                            <span className="text-votr-text-muted text-sm font-mono">{index + 1}</span>
                        )}
                    </div>

                    {/* Song info + bar */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-1">
                            <div className="min-w-0">
                                <span className="text-sm font-medium text-white truncate block">
                                    {song.title}
                                </span>
                                <span className="text-xs text-votr-text-muted">{song.artist}</span>
                            </div>
                            <div className="flex-shrink-0 ml-2 text-right">
                                <span className="text-sm font-bold text-white">{song.percentage}%</span>
                                <span className="text-xs text-votr-text-muted ml-1">({song.votes})</span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 rounded-full bg-votr-dark overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ease-out ${index === 0 ? 'bg-votr-gold' :
                                        index === 1 ? 'bg-votr-gold/60' :
                                            index === 2 ? 'bg-votr-gold/40' :
                                                'bg-votr-text-muted/30'
                                    }`}
                                style={{ width: `${song.percentage}%` }}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
