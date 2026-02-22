'use client';

import { useEffect, useState } from 'react';

interface ReportData {
    band: { name: string; tier: string; slug: string };
    generatedAt: string;
    metrics: {
        totalQrCodes: number;
        totalVotes: number;
        totalScanned: number;
        participationRate: number;
        scanRate: number;
        dataIntegrity: number;
        totalAnomalies: number;
        reviewedAnomalies: number;
        totalSections: number;
    };
    leaderboard: { title: string; artist: string; votes: number; percentage: number }[];
    sectionStats: { name: string; qrCodes: number; votes: number; participation: number }[];
    timeline: { hour: string; count: number }[];
}

export default function SponsorReportPage() {
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('votr_user');
        if (!stored) return;
        const user = JSON.parse(stored);

        fetch(`/api/analytics/report?bandId=${user.bandId}`)
            .then(r => r.json())
            .then(d => setData(d))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-white">
                <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    const maxVotes = Math.max(...data.leaderboard.map(s => s.votes), 1);
    const maxTimeline = Math.max(...data.timeline.map(t => t.count), 1);

    return (
        <div className="bg-white min-h-dvh text-gray-900">
            {/* Print Controls */}
            <div className="print:hidden sticky top-0 z-50 bg-white border-b shadow-sm p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold">📊 Sponsor Report — {data.band.name}</h1>
                        <p className="text-gray-500 text-sm">Generated {new Date(data.generatedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => window.print()} className="px-5 py-2 rounded-lg bg-black text-white font-bold text-sm hover:bg-gray-800">
                            🖨️ Print / Save PDF
                        </button>
                        <button onClick={() => window.history.back()} className="px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50">
                            ← Back
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Content */}
            <div className="max-w-4xl mx-auto p-8 print:p-6 space-y-10 print:space-y-6">

                {/* Header */}
                <div className="text-center border-b-2 border-black pb-6">
                    <h1 className="text-4xl font-black tracking-tight">VOTR</h1>
                    <p className="text-sm text-gray-500 uppercase tracking-widest mt-1">Voice of the Reveller</p>
                    <h2 className="text-2xl font-bold mt-4">{data.band.name}</h2>
                    <p className="text-gray-500">Carnival 2027 · Engagement Analytics Report</p>
                    <p className="text-xs text-gray-400 mt-2">Generated {new Date(data.generatedAt).toLocaleString()}</p>
                </div>

                {/* Executive Summary */}
                <section>
                    <h3 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4">📈 Executive Summary</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Participation Rate', value: `${data.metrics.participationRate}%`, sub: `${data.metrics.totalVotes} of ${data.metrics.totalQrCodes} masqueraders voted` },
                            { label: 'QR Scan Rate', value: `${data.metrics.scanRate}%`, sub: `${data.metrics.totalScanned} codes scanned` },
                            { label: 'Data Integrity', value: `${data.metrics.dataIntegrity}%`, sub: `${data.metrics.totalAnomalies} anomalies flagged` },
                        ].map(m => (
                            <div key={m.label} className="border border-gray-200 rounded-lg p-4 text-center">
                                <p className="text-3xl font-black">{m.value}</p>
                                <p className="text-sm font-medium mt-1">{m.label}</p>
                                <p className="text-xs text-gray-500 mt-1">{m.sub}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Song Leaderboard */}
                <section>
                    <h3 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4">🏆 Road March Leaderboard</h3>
                    <div className="space-y-3">
                        {data.leaderboard.map((song, idx) => (
                            <div key={song.title} className="flex items-center gap-3">
                                <span className="w-8 text-center font-bold text-lg">
                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                                </span>
                                <div className="flex-1">
                                    <div className="flex items-baseline justify-between mb-1">
                                        <div>
                                            <span className="font-bold text-sm">{song.title}</span>
                                            <span className="text-gray-500 text-xs ml-2">— {song.artist}</span>
                                        </div>
                                        <span className="font-bold text-sm">{song.percentage}% <span className="text-gray-400 font-normal">({song.votes})</span></span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-3">
                                        <div
                                            className="h-3 rounded-full"
                                            style={{
                                                width: `${(song.votes / maxVotes) * 100}%`,
                                                background: idx === 0 ? '#FFB800' : idx === 1 ? '#94A3B8' : idx === 2 ? '#CD7F32' : '#E2E8F0',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section Performance */}
                <section className="print:break-before-page">
                    <h3 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4">👥 Section Performance</h3>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-gray-200">
                                <th className="text-left py-2 font-medium text-gray-500">Section</th>
                                <th className="text-right py-2 font-medium text-gray-500">QR Codes</th>
                                <th className="text-right py-2 font-medium text-gray-500">Votes</th>
                                <th className="text-right py-2 font-medium text-gray-500">Participation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.sectionStats.map(sec => (
                                <tr key={sec.name} className="border-b border-gray-100">
                                    <td className="py-2.5 font-medium">{sec.name}</td>
                                    <td className="py-2.5 text-right text-gray-600">{sec.qrCodes}</td>
                                    <td className="py-2.5 text-right text-gray-600">{sec.votes}</td>
                                    <td className="py-2.5 text-right">
                                        <span className={`font-bold ${sec.participation >= 70 ? 'text-green-600' : sec.participation >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                                            {sec.participation}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* Voting Timeline */}
                {data.timeline.length > 0 && (
                    <section>
                        <h3 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4">⏰ Voting Activity Timeline</h3>
                        <div className="flex items-end gap-1 h-32">
                            {data.timeline.map(t => (
                                <div key={t.hour} className="flex-1 flex flex-col items-center">
                                    <div
                                        className="w-full bg-black rounded-t"
                                        style={{ height: `${(t.count / maxTimeline) * 100}%`, minHeight: '2px' }}
                                    />
                                    <span className="text-[8px] text-gray-400 mt-1 rotate-[-45deg]">
                                        {new Date(t.hour).toLocaleTimeString('en-TT', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-4 text-center">
                            Peak activity: {data.timeline.reduce((max, t) => t.count > max.count ? t : max, data.timeline[0]).count} votes/hour
                        </p>
                    </section>
                )}

                {/* Data Quality */}
                <section>
                    <h3 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4">🛡️ Data Quality & Integrity</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="border border-gray-200 rounded-lg p-4">
                            <p className="text-gray-500 text-xs uppercase">Anomalies Flagged</p>
                            <p className="text-2xl font-bold mt-1">{data.metrics.totalAnomalies}</p>
                            <p className="text-xs text-gray-500 mt-1">{data.metrics.reviewedAnomalies} reviewed</p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                            <p className="text-gray-500 text-xs uppercase">Data Integrity Score</p>
                            <p className={`text-2xl font-bold mt-1 ${data.metrics.dataIntegrity >= 95 ? 'text-green-600' : 'text-amber-600'}`}>
                                {data.metrics.dataIntegrity}%
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Verified vote accuracy</p>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t-2 border-black pt-4 text-center text-xs text-gray-500">
                    <p className="font-bold text-black">VOTR — Voice of the Reveller</p>
                    <p>Carnival Engagement Analytics Platform · votr-platform.vercel.app</p>
                    <p className="mt-2">This report was generated automatically. Data reflects real-time voting activity as of the generation timestamp.</p>
                    <p className="mt-1">© 2027 VOTR · Confidential — For Sponsor Use Only</p>
                </footer>
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 15mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
}
