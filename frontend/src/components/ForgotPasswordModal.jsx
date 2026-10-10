import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { API, API_BASE_URL } from '../config';

const FORGOT_URL = API?.forgotPassword || `${API_BASE_URL || 'http://localhost:5001'}/api/auth/forgot-password`;
const VERIFY_URL = API?.verifyResetOtp || `${API_BASE_URL || 'http://localhost:5001'}/api/auth/verify-reset-otp`;
const RESET_URL = API?.resetPassword || `${API_BASE_URL || 'http://localhost:5001'}/api/auth/reset-password`;

export default function ForgotPasswordModal({ isOpen, onClose, onSwitchToLogin }) {
  const [step, setStep] = useState(1); // 1 = Email, 2 = OTP, 3 = New Password, 4 = Done
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 60-second cooldown timer for resending OTP
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputsRef = useRef([]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle countdown timer in Step 2
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Auto-focus first OTP input when arriving at Step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Reset state when modal is closed / opened
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
    } else {
      // Delay reset so exit animation isn't jarring
      const timeout = setTimeout(() => {
        setStep(1);
        setEmail('');
        setOtp(['', '', '', '', '', '']);
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess('');
        setCountdown(60);
        setCanResend(false);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(FORGOT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.msg || 'Failed to send reset code.');
      }

      setStep(2);
      setCountdown(60);
      setCanResend(false);
      setSuccess('Verification code sent! Check your inbox.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP input changes
  const handleOtpChange = (index, value) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const updated = [...otp];
    updated[index] = clean;
    setOtp(updated);

    if (clean && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpInputsRef.current[5]?.focus();
    }
  };

  // Step 2: Verify the 6-Digit Code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const fullCode = otp.join('');

    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: fullCode })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.msg || 'Invalid verification code.');
      }

      setStep(3);
      setSuccess('Code verified! Set your new password.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP in Step 2
  const handleResendOtp = async () => {
    if (!canResend || resendLoading) return;
    setError('');
    setSuccess('');
    setResendLoading(true);

    try {
      const res = await fetch(FORGOT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.msg || 'Failed to resend code.');
      }

      setOtp(['', '', '', '', '', '']);
      setCountdown(60);
      setCanResend(false);
      setSuccess('A fresh 6-digit code has been sent to your email.');
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(RESET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.msg || 'Failed to reset password.');
      }

      setStep(4);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Progress Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step >= 1 ? 'w-8 bg-emerald-600' : 'w-4 bg-slate-200'
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step >= 2 ? 'w-8 bg-emerald-600' : 'w-4 bg-slate-200'
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step >= 3 ? 'w-8 bg-emerald-600' : 'w-4 bg-slate-200'
            }`}
          />
        </div>

        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs mb-3">
            {step === 1 && <Mail size={26} className="text-emerald-600" />}
            {step === 2 && <KeyRound size={26} className="text-emerald-600" />}
            {step === 3 && <Lock size={26} className="text-emerald-600" />}
            {step === 4 && <CheckCircle2 size={26} className="text-emerald-600" />}
          </div>
          <h2 id="forgot-password-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {step === 1 && 'Reset your password'}
            {step === 2 && 'Enter verification code'}
            {step === 3 && 'Create new password'}
            {step === 4 && 'Password updated!'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            {step === 1 && 'Enter your registered email address and we’ll send you a 6-digit recovery code.'}
            {step === 2 && (
              <>
                We sent a 6-digit code to <span className="font-semibold text-slate-700">{email}</span>.
              </>
            )}
            {step === 3 && 'Choose a strong new password with at least 6 characters.'}
            {step === 4 && 'Your account password has been changed. You can now log in.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs sm:text-sm animate-in fade-in duration-150">
            <AlertCircle size={17} className="shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs sm:text-sm animate-in fade-in duration-150">
            <CheckCircle2 size={17} className="shrink-0 mt-0.5 text-emerald-600" />
            <div className="flex-1 font-medium">{success}</div>
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="text-xs font-semibold text-slate-700 block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoFocus
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending code...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Code</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onSwitchToLogin) onSwitchToLogin();
                }}
                className="text-xs text-slate-500 hover:text-emerald-700 font-medium transition cursor-pointer"
              >
                Remember your password? <span className="text-emerald-600 underline">Sign in</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Enter 6-Digit OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2 text-center">
                6-Digit Security Code
              </label>
              <div className="flex justify-center items-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 text-center text-xl font-bold font-mono bg-slate-50/70 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                ))}
              </div>
              <p className="text-center text-[11px] text-slate-400 mt-2">Code is valid for 10 minutes</p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify Code</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Resend and Navigation */}
            <div className="flex flex-col items-center gap-2 pt-1">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <span>Didn't receive the code?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendLoading}
                    className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    {resendLoading && <RefreshCw size={12} className="animate-spin" />}
                    Resend Code
                  </button>
                ) : (
                  <span className="text-slate-400 font-medium">Resend in {countdown}s</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                  setSuccess('');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 mt-1 transition cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Change email address</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Create New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="new-pass" className="text-xs font-semibold text-slate-700 block mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="new-pass"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-pass" className="text-xs font-semibold text-slate-700 block mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="confirm-pass"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <CheckCircle2 size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: Completed State */}
        {step === 4 && (
          <div className="text-center py-4 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={36} />
            </div>
            <p className="text-sm text-slate-600">
              Your password has been successfully reset. You will be redirected to the sign in screen.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onSwitchToLogin) onSwitchToLogin();
              }}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition cursor-pointer"
            >
              Sign In Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
