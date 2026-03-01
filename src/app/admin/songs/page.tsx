'use client';

import { useEffect, useState, useRef } from 'react';

interface Song {
    id: string;
    title: string;
    artist: string;
    year: number;
    is_active: boolean;
    display_order: number;
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
    const [saving, setSaving] = useState(false);

    // Drag state
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    const [dragIdx, setDragIdx] = useState<number | null>(null);

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

    // Drag handlers
    const handleDragStart = (index: number) => {
        dragItem.current = index;
        setDragIdx(index);
    };

    const handleDragEnter = (index: number) => {
        dragOverItem.current = index;
    };

    const handleDragEnd = async () => {
        if (dragItem.current === null || dragOverItem.current === null) {
            setDragIdx(null);
            return;
        }

        const items = [...songs];
        const draggedItem = items[dragItem.current];
        items.splice(dragItem.current, 1);
        items.splice(dragOverItem.current, 0, draggedItem);

        dragItem.current = null;
        dragOverItem.current = null;
        setDragIdx(null);

        setSongs(items);

        // Save new order to backend
        setSaving(true);
        try {
            await fetch('/api/songs/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderedIds: items.map(s => s.id) }),
            });
        } catch { /* ignore */ } finally {
            setSaving(false);
        }
    };

    // Touch drag support
    const handleTouchStart = (index: number) => {
        dragItem.current = index;
        setDragIdx(index);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        const elem = document.elementFromPoint(touch.clientX, touch.clientY);
        if (elem) {
            const songRow = elem.closest('[data-song-index]');
            if (songRow) {
                const idx = parseInt(songRow.getAttribute('data-song-index') || '0');
                dragOverItem.current = idx;
            }
        }
    };

    const handleTouchEnd = () => {
        handleDragEnd();
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
                        {saving && <span className="ml-2 text-votr-gold">· Saving order...</span>}
                    </p>
                </div>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="px-4 py-2 rounded-xl bg-votr-purple text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {showAdd ? 'Cancel' : '🎵 Add Song'}
                </button>
            </div>

            {/* Drag hint */}
            <div className="flex items-center gap-2 text-votr-text-muted text-xs">
                <span>↕️</span>
                <span>Drag songs to reorder — the order is reflected everywhere (voter, dashboard, reports)</span>
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

            {/* Songs list — draggable */}
            <div className="space-y-2">
                {songs.map((song, idx) => (
                    <div
                        key={song.id}
                        data-song-index={idx}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragEnter={() => handleDragEnter(idx)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        onTouchStart={() => handleTouchStart(idx)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        className={`glass-card rounded-xl p-4 flex items-center gap-4 cursor-grab active:cursor-grabbing transition-all ${!song.is_active ? 'opacity-50' : ''
                            } ${dragIdx === idx ? 'scale-[1.02] ring-2 ring-votr-purple/50 shadow-lg' : ''}`}
                    >
                        {/* Drag handle */}
                        <div className="flex-shrink-0 text-votr-text-muted/40 hover:text-votr-text-muted cursor-grab select-none">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <circle cx="5" cy="3" r="1.5" />
                                <circle cx="11" cy="3" r="1.5" />
                                <circle cx="5" cy="8" r="1.5" />
                                <circle cx="11" cy="8" r="1.5" />
                                <circle cx="5" cy="13" r="1.5" />
                                <circle cx="11" cy="13" r="1.5" />
                            </svg>
                        </div>
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
