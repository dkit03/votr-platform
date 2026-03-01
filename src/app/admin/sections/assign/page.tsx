'use client';

import { useEffect, useState } from 'react';

interface Band {
    id: string;
    name: string;
}

interface Section {
    id: string;
    name: string;
}

interface AssignResult {
    success: boolean;
    message: string;
    code?: string;
    section?: string;
}

export default function AdminSectionAssignPage() {
    const [bands, setBands] = useState<Band[]>([]);
    const [selectedBand, setSelectedBand] = useState('');
    const [sections, setSections] = useState<Section[]>([]);
    const [codeInput, setCodeInput] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [results, setResults] = useState<AssignResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBands();
    }, []);

    useEffect(() => {
        if (selectedBand) loadSections();
    }, [selectedBand]); // eslint-disable-line react-hooks/exhaustive-deps

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
            const res = await fetch(`/api/analytics/sections?bandId=${selectedBand}`);
            const data = await res.json();
            if (data.sections) setSections(data.sections);
        } catch { /* ignore */ }
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!codeInput.trim()) return;

        setAssigning(true);
        const code = codeInput.trim().toUpperCase();

        try {
            const res = await fetch('/api/qr-codes/assign', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codeString: code, sectionId: selectedSection || null, bandId: selectedBand }),
            });
            const data = await res.json();

            if (res.ok) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const sectionName = (data.qrCode?.sections as any)?.name || 'Unassigned';
                setResults(prev => [
                    { success: true, message: `✅ ${code} → ${sectionName}`, code, section: sectionName },
                    ...prev,
                ]);
                setCodeInput('');
            } else {
                setResults(prev => [
                    { success: false, message: `❌ ${code}: ${data.error}` },
                    ...prev,
                ]);
            }
        } catch {
            setResults(prev => [
                { success: false, message: `❌ ${code}: Network error` },
                ...prev,
            ]);
        } finally {
            setAssigning(false);
        }
    };

    if (loading && bands.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-votr-purple border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">📋 Section Assignment</h1>
                <p className="text-votr-text-muted text-sm mt-1">
                    Scan or type a QR code to assign it to a section at costume pickup
                </p>
            </div>

            {/* Band Selector */}
            <div className="flex items-center gap-3">
                <label className="text-sm text-votr-text-muted">Band:</label>
                <select
                    value={selectedBand}
                    onChange={e => setSelectedBand(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-votr-dark border border-votr-dark-border text-white text-sm focus:outline-none focus:border-votr-purple"
                >
                    {bands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
            </div>

            {/* Assignment Form */}
            <form onSubmit={handleAssign} className="glass-card rounded-2xl p-6 space-y-4 border-l-4 border-votr-purple">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-votr-text-muted mb-1">QR Code*</label>
                        <input
                            type="text"
                            value={codeInput}
                            onChange={e => setCodeInput(e.target.value.toUpperCase())}
                            placeholder="e.g. TRB-0015-B192"
                            autoFocus
                            required
                            className="w-full px-4 py-3 rounded-xl bg-votr-dark border border-votr-dark-border text-white font-mono text-lg focus:outline-none focus:border-votr-purple transition-colors"
                        />
                        <p className="text-votr-text-muted text-xs mt-1">Type or scan with a barcode reader</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-votr-text-muted mb-1">Section</label>
                        <select
                            value={selectedSection}
                            onChange={e => setSelectedSection(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-votr-dark border border-votr-dark-border text-white focus:outline-none focus:border-votr-purple"
                        >
                            <option value="">— Unassigned —</option>
                            {sections.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={assigning || !codeInput.trim()}
                    className="px-6 py-2.5 rounded-xl bg-votr-purple text-white font-bold text-sm disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {assigning ? 'Assigning...' : '📋 Assign Section'}
                </button>
            </form>

            {/* Recent Assignments */}
            {results.length > 0 && (
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold">Recent Assignments</h3>
                        <span className="text-votr-text-muted text-xs">{results.length} processed</span>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {results.map((r, i) => (
                            <div key={i}
                                className={`p-3 rounded-xl text-sm ${r.success ? 'bg-votr-green/5 border border-votr-green/20' : 'bg-votr-red/5 border border-votr-red/20'}`}
                            >
                                {r.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Tips */}
            <div className="glass-card rounded-2xl p-6 border-l-4 border-votr-purple/50">
                <h3 className="font-bold mb-2">💡 Pickup Workflow Tips</h3>
                <ul className="space-y-1 text-sm text-votr-text-muted">
                    <li>• Use a USB barcode scanner for fastest entry — it types the code automatically</li>
                    <li>• Set the section dropdown once, then scan codes rapidly</li>
                    <li>• Codes that have already been used to vote cannot be reassigned</li>
                    <li>• If a masquerader changes sections, just scan again with the new section</li>
                </ul>
            </div>
        </div>
    );
}
