import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Mail, Lock, User, ArrowRight, RefreshCw, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { API } from '../config';

/**
 * RegisterModal Component
 * Implements a 2-step Email OTP Registration workflow:
 * Step 1: User enters Name, Email, Password -> Backend hashes & sends 6-digit OTP
 * Step 2: User enters 6-digit OTP (6 boxes with auto-focus/paste) -> Backend verifies & registers
 */
export default function RegisterModal({ isOpen, onClose, onSuccess, onSwitchToLogin }) {
  // Steps: 1 = Registration details, 2 = 6-digit OTP verification
  const [step, setStep] = useState(1);

  // Step 1 form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    isSeller: false
  });

  // Step 2 OTP fields (6 separate characters)
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputsRef = useRef([]);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  // Countdown timer for Step 2
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

  // Focus the first OTP input when transitioning to Step 2
  useEffect(() => {
    if (step === 2 && otpInputsRef.current[0]) {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Reset form when modal closes/opens
  useEffect(() => {
    if (!isOpen) {
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Form Input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  // Step 1: Submit Details & Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please provide a valid email address.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(API.sendRegistrationOtp, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.isSeller ? 'seller' : 'buyer'
      });

      setSuccessMsg(response.data.message || 'Verification code sent to your email.');
      setStep(2);
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      const msg = err.response?.data?.msg || err.response?.data?.message || 'Failed to send verification code. Please check your info.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle single OTP box input & auto-focus shift
  const handleOtpChange = (index, value) => {
    if (error) setError('');
    // Allow only numeric input
    const cleanValue = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);

    // Auto-advance to next input
    if (cleanValue && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Handle Backspace navigation across inputs
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle full 6-digit paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      otpInputsRef.current[5]?.focus();
    }
  };

  // Step 2: Verify OTP & Complete Registration
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(API.verifyRegistrationOtp, {
        email: formData.email.trim(),
        otp: fullOtp
      });

      setSuccessMsg('Account verified successfully!');
      
      // Store token and trigger callback
      if (response.data.token) {
        localStorage.setItem('jwt', response.data.token);
        if (onSuccess) {
          onSuccess(response.data.token, response.data.user);
        }
      }

      setTimeout(() => {
        if (onClose) onClose();
      }, 1200);
    } catch (err) {
      const msg = err.response?.data?.msg || err.response?.data?.message || 'Verification failed. The code may be invalid or expired.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || resending) return;
    setError('');
    setResending(true);

    try {
      const response = await axios.post(API.resendRegistrationOtp, {
        email: formData.email.trim()
      });

      setSuccessMsg(response.data.message || 'A fresh verification code has been dispatched.');
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      const msg = err.response?.data?.msg || err.response?.data?.message || 'Could not resend OTP. Please try again.';
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        
        {/* Top Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {step === 1 ? 'Create Account' : 'Verify Email'}
              </h2>
              <p className="text-xs text-slate-500">
                {step === 1 ? 'Step 1 of 2: Registration details' : 'Step 2 of 2: 6-Digit OTP security code'}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-sm flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-sm flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">
          {step === 1 ? (
            /* =========================================================================
               STEP 1: Registration Form
               ========================================================================= */
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Jane Doe"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Optional Seller Flag */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isSellerCheck"
                  name="isSeller"
                  checked={formData.isSeller}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <label htmlFor="isSellerCheck" className="text-xs text-slate-600 select-none cursor-pointer">
                  I want to register as a <strong>Seller / Service Provider</strong>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating & Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Email Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* =========================================================================
               STEP 2: 6-Digit OTP Verification Form
               ========================================================================= */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center">
                <p className="text-sm text-slate-600">
                  Enter the 6-digit code sent to:
                </p>
                <div className="inline-flex items-center space-x-1.5 mt-1 font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-xs border border-emerald-100">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{formData.email}</span>
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-600 transition"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Incorrect email? Edit details</span>
                  </button>
                </div>
              </div>

              {/* 6 OTP Input Boxes */}
              <div className="flex justify-between items-center gap-2 px-1" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputsRef.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold font-mono bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none text-slate-900 transition-all shadow-sm"
                  />
                ))}
              </div>

              <div className="text-center text-xs text-slate-500">
                Code expires in <strong>10 minutes</strong>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Complete Registration</span>
                  </>
                )}
              </button>

              {/* Resend OTP Section with Countdown */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Didn't receive the code?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center space-x-1 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                    <span>Resend OTP</span>
                  </button>
                ) : (
                  <span className="text-slate-400 font-medium">
                    Resend in <strong className="text-emerald-600 font-bold">{countdown}s</strong>
                  </span>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer / Switch to Login */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-emerald-600 hover:text-emerald-700 transition"
          >
            Sign in
          </button>
        </div>

      </div>
    </div>
  );
}
