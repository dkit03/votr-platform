'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { SongCard } from '@/components/vote/SongCard';
import { VoteConfirmation } from '@/components/vote/VoteConfirmation';
import { AlreadyVoted } from '@/components/vote/AlreadyVoted';
import { VotingClosed } from '@/components/vote/VotingClosed';
import { ErrorScreen } from '@/components/vote/ErrorScreen';
import { LoadingScreen } from '@/components/vote/LoadingScreen';
import { PowderBackground } from '@/components/vote/PowderBackground';
import { VoteSuccess } from '@/components/vote/VoteSuccess';

interface Song {
    id: string;
    title: string;
    artist: string;
    thumbnail_url?: string;
}

interface BandInfo {
    name: string;
    slug: string;
    logo_url?: string;
    colors?: { primary: string; secondary: string };
}

type VoteStatus = 'loading' | 'ready' | 'already_voted' | 'not_open' | 'closed' | 'error' | 'confirming' | 'submitting' | 'success';

export default function VotePage({ params }: { params: Promise<{ code: string }> }) {
    const [status, setStatus] = useState<VoteStatus>('loading');
    const [code, setCode] = useState<string>('');
    const [songs, setSongs] = useState<Song[]>([]);
    const [band, setBand] = useState<BandInfo | null>(null);
    const [section, setSection] = useState<string | null>(null);
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const [votedSong, setVotedSong] = useState<{ title: string; artist: string } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [votedAt, setVotedAt] = useState<string | null>(null);
    const [opensAt, setOpensAt] = useState<string | null>(null);

    useEffect(() => {
        params.then(({ code: c }) => {
            setCode(c);
            validateCode(c);
        });
    }, [params]);

    const validateCode = async (qrCode: string) => {
        try {
            const res = await fetch(`/api/vote/validate?code=${encodeURIComponent(qrCode)}`);
            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(data.error || 'Invalid QR code');
                setStatus('error');
                return;
            }

            setBand(data.band);

            switch (data.status) {
                case 'ready':
                    setSongs(data.songs);
                    setSection(data.section);
                    setStatus('ready');
                    break;
                case 'already_voted':
                    setVotedAt(data.votedAt);
                    setStatus('already_voted');
                    break;
                case 'not_open':
                    setOpensAt(data.opensAt);
                    setStatus('not_open');
                    break;
                case 'closed':
                    setStatus('closed');
                    break;
                default:
                    setStatus('error');
            }
        } catch {
            setErrorMessage('Unable to connect. Check your internet and try again.');
            setStatus('error');
        }
    };

    const handleSongSelect = (song: Song) => {
        setSelectedSong(song);
        setStatus('confirming');
    };

    const handleConfirmVote = async () => {
        if (!selectedSong) return;

        setStatus('submitting');

        try {
            const res = await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    songId: selectedSong.id,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.code === 'ALREADY_VOTED') {
                    setVotedAt(data.votedAt);
                    setStatus('already_voted');
                } else if (data.code === 'RATE_LIMITED') {
                    setErrorMessage('Too many requests. Please wait a moment and try again.');
                    setStatus('error');
                } else {
                    setErrorMessage(data.error || 'Something went wrong');
                    setStatus('error');
                }
                return;
            }

            setVotedSong(data.song);
            setStatus('success');
        } catch {
            setErrorMessage('Unable to submit vote. Check your internet and try again.');
            setStatus('error');
        }
    };

    const handleCancelConfirm = () => {
        setSelectedSong(null);
        setStatus('ready');
    };

    return (
        <div className="relative min-h-dvh overflow-hidden">
            <PowderBackground />

            <div className="relative z-10 flex min-h-dvh flex-col">
                {/* Header */}
                <header className="flex flex-col items-center pt-8 pb-4 px-4">
                    <Image
                        src="/icons/logo-full.png"
                        alt="VOTR"
                        width={140}
                        height={60}
                        priority
                    />
                    {band && (
                        <div className="mt-4 px-4 py-1.5 rounded-full glass-card">
                            <span className="text-sm font-medium" style={{ color: band.colors?.primary || '#FFB800' }}>
                                {band.name}
                            </span>
                        </div>
                    )}
                </header>

                {/* Content */}
                <main className="flex-1 flex flex-col px-4 pb-8">
                    {status === 'loading' && <LoadingScreen />}

                    {status === 'ready' && (
                        <div className="flex-1 flex flex-col animate-slide-up">
                            <h1 className="text-2xl font-bold text-center mb-1">
                                Pick your <span className="text-votr-gold">Road March</span> song! 🎵
                            </h1>
                            <p className="text-votr-text-muted text-sm text-center mb-6">
                                {section && <span>Section: {section} · </span>}
                                Tap to select
                            </p>

                            <div className="flex-1 space-y-3">
                                {songs.map((song, index) => (
                                    <SongCard
                                        key={song.id}
                                        song={song}
                                        index={index}
                                        onSelect={() => handleSongSelect(song)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {status === 'confirming' && selectedSong && (
                        <VoteConfirmation
                            song={selectedSong}
                            bandColors={band?.colors}
                            onConfirm={handleConfirmVote}
                            onCancel={handleCancelConfirm}
                        />
                    )}

                    {status === 'submitting' && (
                        <LoadingScreen message="Recording your vote..." />
                    )}

                    {status === 'success' && votedSong && (
                        <VoteSuccess
                            song={votedSong}
                            bandName={band?.name || ''}
                        />
                    )}

                    {status === 'already_voted' && (
                        <AlreadyVoted votedAt={votedAt} bandName={band?.name} />
                    )}

                    {status === 'closed' && (
                        <VotingClosed bandName={band?.name} />
                    )}

                    {status === 'not_open' && (
                        <VotingClosed
                            bandName={band?.name}
                            opensAt={opensAt}
                            notYetOpen
                        />
                    )}

                    {status === 'error' && (
                        <ErrorScreen message={errorMessage} onRetry={() => validateCode(code)} />
                    )}
                </main>

                {/* Footer */}
                <footer className="py-4 text-center">
                    <p className="text-votr-text-muted text-xs">
                        Powered by <span className="text-votr-gold font-semibold">VOTR</span> ✨
                    </p>
                </footer>
            </div>
        </div>
    );
}
