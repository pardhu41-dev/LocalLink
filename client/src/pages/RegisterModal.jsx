import React, { useState } from 'react';
import { Mail, Lock, User, KeyRound, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RegisterModal({ onSuccess, onClose }) {
    const [step, setStep] = useState(1); // 1 = Details, 2 = OTP
    const [formData, setFormData] = useState({ name: '', email: '', password: '', otp: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Handle Step 1: Send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5001/api/auth/send-registration-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password
                })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

            setMessage(`Verification code sent to ${formData.email}`);
            setStep(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle Step 2: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5001/api/auth/verify-registration-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    otp: formData.otp
                })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Invalid OTP');

            // Store token in localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            if (onSuccess) onSuccess(data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 mb-3">
                        {step === 1 ? <User size={24} /> : <KeyRound size={24} />}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                        {step === 1 ? 'Create an Account' : 'Verify Your Email'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        {step === 1 ? 'Enter your details to receive a 6-digit verification code.' : message}
                    </p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Step 1: Account Details */}
                {step === 1 ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-200"
                        >
                            {loading ? 'Sending Code...' : <><span>Continue</span> <ArrowRight size={16} /></>}
                        </button>
                    </form>
                ) : (
                    /* Step 2: 6-Digit Code */
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1 text-center">
                                Enter 6-Digit Code
                            </label>
                            <input
                                type="text"
                                required
                                maxLength="6"
                                placeholder="123456"
                                value={formData.otp}
                                onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                                className="w-full py-3 text-center text-2xl font-bold tracking-widest border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || formData.otp.length !== 6}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : <><span>Verify & Complete Registration</span> <CheckCircle2 size={16} /></>}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full text-xs text-slate-500 hover:text-slate-800 text-center font-medium"
                        >
                            ← Back to edit details
                        </button>
                    </form>
                )}

            </div>
        </div>
    );
}