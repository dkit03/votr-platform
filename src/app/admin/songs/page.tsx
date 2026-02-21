'use client';

import { useEffect, useState } from 'react';

interface Song {
    id: string;
    title: string;
    artist: string;
    year: number;
    is_active: boolean;
    created_at: string;
}

export default function AdminSongsPage() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [year, setYear] = useState(2027);
    const [adding, setAdding] = useState(false);

    useEffect(() => { loadSongs(); }, []);

    const loadSongs = async () => {
        try {
            const res = await fetch('/api/songs?all=true');
            const data = await res.json();
            if (res.ok) setSongs(data.songs || []);
        } catch { /* ignore */ } finally { setLoading(false); }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        try {
            const res = await fetch('/api/songs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, artist, year }),
            });
            if (res.ok) {
                loadSongs();
                setShowAdd(false);
                setTitle(''); setArtist('');
            }
        } catch { /* ignore */ } finally { setAdding(false); }
    };

    const toggleActive = async (song: Song) => {
        const res = await fetch(`/api/songs/${song.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !song.is_active }),
        });
        if (res.ok) {
            setSongs(prev => prev.map(s => s.id === song.id ? { ...s, is_active: !s.is_active } : s));
        }
    };

    const deleteSong = async (song: Song) => {
        if (!confirm(`Delete "${song.title}" by ${song.artist}?`)) return;
        const res = await fetch(`/api/songs/${song.id}`, { method: 'DELETE' });
        if (res.ok) setSongs(prev => prev.filter(s => s.id !== song.id));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-votr-purple border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const active = songs.filter(s => s.is_active);
    const inactive = songs.filter(s => !s.is_active);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Song Library</h1>
                    <p className="text-votr-text-muted text-sm mt-1">
                        {active.length} active · {inactive.length} inactive · {songs.length} total
                    </p>
                </div>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="px-4 py-2 rounded-xl bg-votr-purple text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {showAdd ? 'Cancel' : '🎵 Add Song'}
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleAdd} className="glass-card rounded-2xl p-6 space-y-4 border-l-4 border-votr-purple">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-votr-text-muted mb-1">Song Title*</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                                className="w-full px-4 py-3 rounded-xl bg-votr-dark border border-votr-dark-border text-white focus:outline-none focus:border-votr-purple" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-votr-text-muted mb-1">Artist*</label>
                            <input type="text" value={artist} onChange={e => setArtist(e.target.value)} required
                                className="w-full px-4 py-3 rounded-xl bg-votr-dark border border-votr-dark-border text-white focus:outline-none focus:border-votr-purple" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-votr-text-muted mb-1">Year</label>
                            <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))}
                                className="w-full px-4 py-3 rounded-xl bg-votr-dark border border-votr-dark-border text-white focus:outline-none focus:border-votr-purple" />
                        </div>
                    </div>
                    <button type="submit" disabled={adding}
                        className="px-6 py-2.5 rounded-xl bg-votr-purple text-white font-bold text-sm disabled:opacity-50">
                        {adding ? 'Adding...' : 'Add Song'}
                    </button>
                </form>
            )}

            {/* Songs list */}
            <div className="space-y-2">
                {songs.map((song, idx) => (
                    <div key={song.id} className={`glass-card rounded-xl p-4 flex items-center gap-4 ${!song.is_active ? 'opacity-50' : ''}`}>
                        <span className="text-votr-text-muted font-mono text-sm w-6">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{song.title}</p>
                            <p className="text-votr-text-muted text-xs truncate">{song.artist} · {song.year}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={() => toggleActive(song)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${song.is_active
                                        ? 'bg-votr-green/10 text-votr-green'
                                        : 'bg-votr-text-muted/10 text-votr-text-muted'
                                    }`}
                            >
                                {song.is_active ? 'Active' : 'Inactive'}
                            </button>
                            <button
                                onClick={() => deleteSong(song)}
                                className="px-2 py-1 rounded-lg text-xs text-votr-red/60 hover:text-votr-red hover:bg-votr-red/10 transition-colors"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
