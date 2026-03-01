'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface QrCode {
    id: string;
    code_string: string;
    masquerader_name: string | null;
    masquerader_email: string | null;
    voted: boolean;
    voted_at: string | null;
    scanned_at: string | null;
    sections: { name: string } | null;
    created_at: string;
}

interface Band {
    id: string;
    name: string;
    slug: string;
}

interface Section {
    id: string;
    name: string;
}

type Filter = 'all' | 'voted' | 'unvoted' | 'scanned';

export default function AdminQrCodesPage() {
    const [codes, setCodes] = useState<QrCode[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState<Filter>('all');
    const [loading, setLoading] = useState(true);

    // Band selector
    const [bands, setBands] = useState<Band[]>([]);
    const [selectedBand, setSelectedBand] = useState('');

    // Sections for generation
    const [sections, setSections] = useState<Section[]>([]);
    const [genSection, setGenSection] = useState('');

    // Generate modal
    const [showGenerate, setShowGenerate] = useState(false);
    const [genCount, setGenCount] = useState(100);
    const [genPrefix, setGenPrefix] = useState('VOTR');
    const [generating, setGenerating] = useState(false);
    const [genResult, setGenResult] = useState<string | null>(null);

    useEffect(() => {
        loadBands();
    }, []);

    useEffect(() => {
        if (selectedBand) {
            loadCodes();
            loadSections();
        }
    }, [page, filter, selectedBand]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadBands = async () => {
        try {
            const res = await fetch('/api/admin/bands');
            const data = await res.json();
            if (res.ok && data.bands?.length > 0) {
                setBands(data.bands);
                setSelectedBand(data.bands[0].id);
            }
        } catch { /* ignore */ } finally { setLoading(false); }
    };

    const loadSections = async () => {
        try {
            const res = await fetch(`/api/sections?band_id=${selectedBand}`);
            const data = await res.json();
            if (res.ok) setSections(data.sections || []);
        } catch { /* ignore */ }
    };

    const loadCodes = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/qr-codes?band_id=${selectedBand}&page=${page}&filter=${filter}`);
            const data = await res.json();
            if (res.ok) {
                setCodes(data.qrCodes || []);
                setTotal(data.total || 0);
                setTotalPages(data.totalPages || 1);
            }
        } catch { /* ignore */ } finally { setLoading(false); }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenerating(true);
        setGenResult(null);
        try {
            const res = await fetch('/api/qr-codes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bandId: selectedBand, count: genCount, prefix: genPrefix, sectionId: genSection || null }),
            });
            const data = await res.json();
            if (res.ok) {
                setGenResult(`✅ Generated ${data.generated} QR codes`);
                loadCodes();
            } else {
                setGenResult(`❌ ${data.error}`);
            }
        } catch {
            setGenResult('❌ Failed to generate codes.');
        } finally { setGenerating(false); }
    };

    const filters: { value: Filter; label: string }[] = [
        { value: 'all', label: 'All' },
        { value: 'voted', label: 'Voted' },
        { value: 'unvoted', label: 'Not Voted' },
        { value: 'scanned', label: 'Scanned' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">QR Codes</h1>
                    <p className="text-votr-text-muted text-sm mt-1">
                        {total.toLocaleString()} codes total
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href={`/dashboard/qr-codes/print?bandId=${selectedBand}`}
                        className="px-4 py-2 rounded-xl border border-votr-dark-border text-votr-text-muted font-medium text-sm transition-all hover:border-votr-purple/30 hover:text-white"
                    >
                        🖨️ Print
                    </Link>
                    <button
                        onClick={() => setShowGenerate(!showGenerate)}
                        className="px-4 py-2 rounded-xl bg-votr-purple text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {showGenerate ? 'Cancel' : '⚡ Generate Codes'}
                    </button>
                </div>
            </div>

            {/* Band Selector */}
            <div className="flex items-center gap-3">
                <label className="text-sm text-votr-text-muted">Band:</label>
                <select
                    value={selectedBand}
                    onChange={e => { setSelectedBand(e.target.value); setPage(1); }}
                    className="px-3 py-2 rounded-lg bg-votr-dark border border-votr-dark-border text-white text-sm focus:outline-none focus:border-votr-purple"
                >
                    {bands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
            </div>

            {/* Generate Form */}
            {showGenerate && (
                <form onSubmit={handleGenerate} className="glass-card rounded-2xl p-6 space-y-4 border-l-4 border-votr-purple">
                    <h3 className="font-bold">Generate QR Codes for {bands.find(b => b.id === selectedBand)?.name}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-votr-text-muted mb-1">Quantity</label>
                            <input type="number" value={genCount}
                                onChange={(e) => setGenCount(Math.min(2000, parseInt(e.target.value) || 0))}
                                min={1} max={2000}
                                className="w-full px-4 py-3 rounded-xl bg-votr-dark border border-votr-dark-border text-white focus:outline-none focus:border-votr-purple" />
                            <p className="text-votr-text-muted text-xs mt-1">Max 2,000 per batch</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-votr-text-muted mb-1">Code Prefix</label>
                            <input type="text" value={genPrefix}
                                onChange={(e) => setGenPrefix(e.target.value.toUpperCase().slice(0, 6))}
                                maxLength={6}
                                className="w-full px-4 py-3 rounded-xl bg-votr-dark border border-votr-dark-border text-white font-mono focus:outline-none focus:border-votr-purple" />
                            <p className="text-votr-text-muted text-xs mt-1">e.g. VOTR, TRB, YUM</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-votr-text-muted mb-1">Section</label>
                            <select
                                value={genSection}
                                onChange={e => setGenSection(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-votr-dark border border-votr-dark-border text-white focus:outline-none focus:border-votr-purple"
                            >
                                <option value="">— No Section —</option>
                                {sections.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <p className="text-votr-text-muted text-xs mt-1">Pre-assign to a section</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button type="submit" disabled={generating}
                            className="px-6 py-2.5 rounded-xl bg-votr-purple text-white font-bold text-sm disabled:opacity-50">
                            {generating ? 'Generating...' : `Generate ${genCount} Codes`}
                        </button>
                        {genResult && <p className="text-sm">{genResult}</p>}
                    </div>
                </form>
            )}

            {/* Filters */}
            <div className="flex gap-2">
                {filters.map(f => (
                    <button key={f.value}
                        onClick={() => { setFilter(f.value); setPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f.value
                            ? 'bg-votr-purple/10 text-votr-purple'
                            : 'text-votr-text-muted hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Codes Table */}
            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="w-8 h-8 border-2 border-votr-purple border-t-transparent rounded-full animate-spin" />
                </div>
            ) : codes.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                    <p className="text-votr-text-muted">No QR codes found. Generate some to get started!</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-votr-dark-border">
                                <th className="text-left py-3 px-4 text-votr-text-muted font-medium">Code</th>
                                <th className="text-left py-3 px-4 text-votr-text-muted font-medium hidden sm:table-cell">Section</th>
                                <th className="text-left py-3 px-4 text-votr-text-muted font-medium">Status</th>
                                <th className="text-left py-3 px-4 text-votr-text-muted font-medium hidden md:table-cell">Voted At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {codes.map(code => (
                                <tr key={code.id} className="border-b border-votr-dark-border/50 hover:bg-white/[0.02]">
                                    <td className="py-3 px-4 font-mono text-xs text-white">{code.code_string}</td>
                                    <td className="py-3 px-4 text-votr-text-muted hidden sm:table-cell">
                                        {code.sections?.name || '—'}
                                    </td>
                                    <td className="py-3 px-4">
                                        {code.voted ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-votr-green/10 text-votr-green">
                                                ✅ Voted
                                            </span>
                                        ) : code.scanned_at ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-votr-gold/10 text-votr-gold">
                                                📱 Scanned
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-votr-dark-border text-votr-text-muted">
                                                ⏳ Unused
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-votr-text-muted text-xs hidden md:table-cell">
                                        {code.voted_at
                                            ? new Date(code.voted_at).toLocaleString('en-TT', { dateStyle: 'short', timeStyle: 'short' })
                                            : '—'
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg text-sm text-votr-text-muted hover:text-white disabled:opacity-30">
                        ← Previous
                    </button>
                    <span className="text-sm text-votr-text-muted">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg text-sm text-votr-text-muted hover:text-white disabled:opacity-30">
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
