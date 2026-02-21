'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type AuthStep = 'email' | 'otp' | 'loading';

export default function DashboardLoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<AuthStep>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to send code.');
                setLoading(false);
                return;
            }

            setStep('otp');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token: otp }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Invalid code.');
                setLoading(false);
                return;
            }

            // Store session info
            localStorage.setItem('votr_session', JSON.stringify(data.session));
            localStorage.setItem('votr_user', JSON.stringify(data.user));

            // Redirect based on role
            if (data.user.role === 'platform_admin') {
                router.push('/admin');
            } else {
                router.push('/dashboard');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-dvh flex flex-col items-center justify-center px-4">
            {/* Background */}
            <div className="fixed inset-0 bg-gradient-to-b from-votr-dark via-votr-dark to-[#0D1225] -z-10" />
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-votr-purple/5 to-transparent rounded-full blur-3xl -z-10" />

            {/* Logo */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold tracking-tight">
                    <span className="text-votr-gold">V</span>
                    <span className="text-white">OTR</span>
                </h1>
                <p className="text-votr-text-muted text-xs tracking-widest uppercase mt-1">
                    Band Dashboard
                </p>
            </div>

            {/* Login Card */}
            <div className="glass-card rounded-3xl p-8 w-full max-w-sm">
                {step === 'email' && (
                    <form onSubmit={handleSendOtp} className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-center mb-2">Band Leader Login</h2>
                            <p className="text-votr-text-muted text-sm text-center">
                                Enter your registered email to receive a verification code
                            </p>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-votr-text-muted mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@tribeband.com"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-votr-dark border border-votr-dark-border text-white placeholder-votr-text-muted/50 focus:outline-none focus:border-votr-gold transition-colors"
                            />
                        </div>

                        {error && (
                            <p className="text-votr-red text-sm text-center">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-votr-gold text-votr-dark font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {loading ? 'Sending...' : 'Send Verification Code'}
                        </button>
                    </form>
                )}

                {step === 'otp' && (
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-center mb-2">Enter Code</h2>
                            <p className="text-votr-text-muted text-sm text-center">
                                We sent a 6-digit code to <span className="text-white font-medium">{email}</span>
                            </p>
                        </div>

                        <div>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                required
                                className="w-full px-4 py-4 rounded-xl bg-votr-dark border border-votr-dark-border text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-votr-text-muted/30 focus:outline-none focus:border-votr-gold transition-colors"
                                autoFocus
                            />
                        </div>

                        {error && (
                            <p className="text-votr-red text-sm text-center">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || otp.length < 6}
                            className="w-full py-3 rounded-xl bg-votr-gold text-votr-dark font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {loading ? 'Verifying...' : 'Verify & Login'}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                            className="w-full py-2 text-votr-text-muted text-sm hover:text-white transition-colors"
                        >
                            ← Use a different email
                        </button>
                    </form>
                )}
            </div>

            {/* Footer */}
            <p className="mt-8 text-votr-text-muted text-xs">
                © 2027 VOTR · Carnival Engagement Analytics
            </p>
        </div>
    );
}
