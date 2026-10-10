import React, { useState } from 'react';
import { Mail, KeyRound, Lock, CheckCircle2, AlertCircle, ArrowRight, X } from 'lucide-react';

export default function ForgotPasswordModal({ isOpen, onClose, onSwitchToLogin }) {
  const [step, setStep] = useState(1); // 1 = Email, 2 = OTP, 3 = New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset code');

      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify the 6-Digit Code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5001/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');

      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setSuccess('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        onClose();
        if (onSwitchToLogin) onSwitchToLogin();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 mb-3">
            {step === 1 && <Mail size={22} />}
            {step === 2 && <KeyRound size={22} />}
            {step === 3 && <Lock size={22} />}
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Enter Verification Code'}
            {step === 3 && 'Set New Password'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {step === 1 && 'Enter your registered email to receive a 6-digit code.'}
            {step === 2 && `Enter the code sent to ${email}`}
            {step === 3 && 'Choose a strong new password for your account.'}
          </p>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-700 text-xs">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Step 1: Email Form */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Your Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 disabled:opacity-50"
            >
              {loading ? 'Sending Code...' : <><span>Send Code</span> <ArrowRight size={15} /></>}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification Form */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1 text-center">
                6-Digit Code
              </label>
              <input
                type="text"
                required
                maxLength="6"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full py-3 text-center text-2xl font-bold tracking-widest border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : <><span>Verify Code</span> <CheckCircle2 size={15} /></>}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-xs text-slate-500 hover:text-slate-800 text-center font-medium"
            >
              ← Change email address
            </button>
          </form>
        )}

        {/* Step 3: New Password Form */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : <><span>Reset Password</span> <CheckCircle2 size={15} /></>}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}