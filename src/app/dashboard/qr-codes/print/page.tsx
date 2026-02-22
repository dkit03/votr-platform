'use client';

import { useEffect, useState } from 'react';

interface QRCodeItem {
    id: string;
    codeString: string;
    section: string;
    voted: boolean;
    voteUrl: string;
    qrDataUrl: string;
}

interface PrintData {
    band: { name: string; slug: string };
    codes: QRCodeItem[];
    total: number;
}

export default function QRPrintPage() {
    const [data, setData] = useState<PrintData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [layout, setLayout] = useState<'grid-6' | 'grid-9' | 'list'>('grid-6');

    useEffect(() => {
        const stored = localStorage.getItem('votr_user');
        if (!stored) return;
        const user = JSON.parse(stored);

        fetch(`/api/qr-codes/print?bandId=${user.bandId}&limit=200`)
            .then(r => r.json())
            .then(d => { if (d.error) setError(d.error); else setData(d); })
            .catch(() => setError('Failed to load'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-white">
                <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-white">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    const gridClass = layout === 'grid-9'
        ? 'grid-cols-3'
        : layout === 'grid-6'
            ? 'grid-cols-3 sm:grid-cols-3'
            : 'grid-cols-1';

    // Group by section for organized printing
    const sections = new Map<string, QRCodeItem[]>();
    data.codes.forEach(code => {
        const existing = sections.get(code.section) || [];
        existing.push(code);
        sections.set(code.section, existing);
    });

    return (
        <div className="bg-white min-h-dvh">
            {/* Controls — hidden when printing */}
            <div className="print:hidden sticky top-0 z-50 bg-white border-b shadow-sm p-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">🖨️ Print QR Codes — {data.band.name}</h1>
                        <p className="text-gray-500 text-sm">{data.total} codes ready for printing</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={layout}
                            onChange={e => setLayout(e.target.value as typeof layout)}
                            className="px-3 py-2 rounded-lg border text-sm text-gray-700"
                        >
                            <option value="grid-6">6 per page (large)</option>
                            <option value="grid-9">9 per page (compact)</option>
                            <option value="list">List view</option>
                        </select>
                        <button
                            onClick={() => window.print()}
                            className="px-5 py-2 rounded-lg bg-black text-white font-bold text-sm hover:bg-gray-800 transition-colors"
                        >
                            🖨️ Print / Save PDF
                        </button>
                        <button
                            onClick={() => window.history.back()}
                            className="px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50"
                        >
                            ← Back
                        </button>
                    </div>
                </div>
            </div>

            {/* Printable content */}
            <div className="max-w-6xl mx-auto p-6 print:p-0 print:max-w-none">
                {Array.from(sections.entries()).map(([sectionName, codes]) => (
                    <div key={sectionName} className="mb-8 print:mb-4">
                        {/* Section Header */}
                        <div className="mb-4 print:mb-2 print:break-before-page first:print:break-before-auto">
                            <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-200 pb-2 print:text-lg">
                                📋 {sectionName} — {codes.length} codes
                            </h2>
                        </div>

                        {layout === 'list' ? (
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="border-b-2 border-gray-200">
                                        <th className="text-left py-2 px-2 font-medium text-gray-500">QR Code</th>
                                        <th className="text-left py-2 px-2 font-medium text-gray-500">Code</th>
                                        <th className="text-left py-2 px-2 font-medium text-gray-500">Section</th>
                                        <th className="text-left py-2 px-2 font-medium text-gray-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {codes.map(code => (
                                        <tr key={code.id} className="border-b border-gray-100">
                                            <td className="py-2 px-2">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={code.qrDataUrl} alt={code.codeString} className="w-16 h-16" />
                                            </td>
                                            <td className="py-2 px-2 font-mono text-xs text-gray-700">{code.codeString}</td>
                                            <td className="py-2 px-2 text-gray-600">{code.section}</td>
                                            <td className="py-2 px-2">
                                                <span className={code.voted ? 'text-green-600' : 'text-gray-400'}>
                                                    {code.voted ? '✅ Voted' : '⬜ Unused'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className={`grid ${gridClass} gap-4 print:gap-2`}>
                                {codes.map(code => (
                                    <div
                                        key={code.id}
                                        className={`border border-gray-200 rounded-lg p-3 text-center print:rounded-none print:border-gray-300 ${code.voted ? 'opacity-40' : ''
                                            }`}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={code.qrDataUrl}
                                            alt={code.codeString}
                                            className={`mx-auto ${layout === 'grid-9' ? 'w-24 h-24' : 'w-32 h-32'} print:w-28 print:h-28`}
                                        />
                                        <p className="font-mono text-xs text-gray-800 mt-2 font-bold">{code.codeString}</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">{code.section}</p>
                                        <p className="text-[9px] text-gray-400 mt-1">Scan to vote • votr-platform.vercel.app</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Print styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
}
