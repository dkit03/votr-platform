'use client';

import { useEffect, useState } from 'react';

interface Song {
    id: string;
    title: string;
    artist: string;
    thumbnail_url: string | null;
    is_active: boolean;
    created_at: string;
}

export default function SongsPage() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newArtist, setNewArtist] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSongs();
    }, []);

    const loadSongs = async () => {
        try {
            const res = await fetch('/api/songs');
            const data = await res.json();
            if (res.ok) setSongs(data.songs || []);
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    };

    const handleAddSong = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/songs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle, artist: newArtist }),
            });
            if (res.ok) {
                setNewTitle('');
                setNewArtist('');
                setShowAdd(false);
                loadSongs();
            }
        } catch { /* ignore */ } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id: string, currentActive: boolean) => {
        try {
            await fetch(`/api/songs/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !currentActive }),
            });
            loadSongs();
        } catch { /* ignore */ }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-votr-gold border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Songs</h1>
                    <p className="text-votr-text-muted text-sm mt-1">
                        Manage Road March song list
                    </p>
                </div>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="px-4 py-2 rounded-xl bg-votr-gold text-votr-dark font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {showAdd ? 'Cancel' : '+ Add Song'}
                </button>
            </div>

            {/* Add Song Form */}
            {showAdd && (
                <form onSubmit={handleAddSong} className="glass-card rounded-2xl p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-votr-text-muted mb-1">Song Title</label>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="Like It Hot"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-votr-dark border border-votr-dark-border text-white placeholder-votr-text-muted/50 focus:outline-none focus:border-votr-gold transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-votr-text-muted mb-1">Artist</label>
                            <input
                                type="text"
                                value={newArtist}
                                onChange={(e) => setNewArtist(e.target.value)}
                                placeholder="Machel Montano"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-votr-dark border border-votr-dark-border text-white placeholder-votr-text-muted/50 focus:outline-none focus:border-votr-gold transition-colors"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 rounded-xl bg-votr-gold text-votr-dark font-bold text-sm disabled:opacity-50"
                    >
                        {saving ? 'Adding...' : 'Add Song'}
                    </button>
                </form>
            )}

            {/* Song List */}
            <div className="space-y-3">
                {songs.length === 0 ? (
                    <div className="glass-card rounded-2xl p-8 text-center">
                        <p className="text-votr-text-muted">No songs added yet. Add some to get started!</p>
                    </div>
                ) : (
                    songs.map((song, index) => (
                        <div
                            key={song.id}
                            className={`glass-card rounded-xl p-4 flex items-center gap-4 ${!song.is_active ? 'opacity-50' : ''}`}
                        >
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-votr-gold/20 to-votr-red/20 flex items-center justify-center">
                                <span className="text-sm font-mono text-votr-text-muted">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white truncate">{song.title}</h3>
                                <p className="text-votr-text-muted text-sm truncate">{song.artist}</p>
                            </div>
                            <button
                                onClick={() => handleToggle(song.id, song.is_active)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${song.is_active
                                        ? 'bg-votr-green/10 text-votr-green hover:bg-votr-green/20'
                                        : 'bg-votr-red/10 text-votr-red hover:bg-votr-red/20'
                                    }`}
                            >
                                {song.is_active ? 'Active' : 'Inactive'}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
