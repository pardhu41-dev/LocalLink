import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Fade,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Divider,
  Collapse
} from '@mui/material';
import axios from 'axios';
import { API } from './config';
import ForgotPasswordModal from './components/ForgotPasswordModal';

const AuthForms = ({ setToken }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [registerStep, setRegisterStep] = useState(1); // 1 = Details, 2 = OTP Code
  const [form, setForm] = useState({ name: '', email: '', password: '', isSeller: false });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  const [fadeIn, setFadeIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ show: false, severity: 'info', message: '' });

  // Countdown timer for OTP resend (60s)
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Legacy resend link state for unverified login attempts
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState('');

  useEffect(() => {
    let timer;
    if (!isLogin && registerStep === 2 && countdown > 0) {
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
  }, [isLogin, registerStep, countdown]);

  // Focus the first OTP input upon transitioning to step 2
  useEffect(() => {
    if (!isLogin && registerStep === 2 && otpRefs.current[0]) {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    }
  }, [isLogin, registerStep]);

  const handleChange = (e) =>
    setForm({
      ...form,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    });

  // Handle single digit input
  const handleOtpChange = (index, value) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = clean;
    setOtp(newOtp);

    if (clean && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste of 6 digits
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // Login handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlertInfo({ show: false, severity: 'info', message: '' });

    try {
      const res = await axios.post(API.login, {
        email: form.email,
        password: form.password
      });
      setToken(res.data.token);
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'An error occurred during authentication';
      setAlertInfo({ show: true, severity: 'error', message: errorMsg });
      if (errorMsg.toLowerCase().includes('verify')) {
        setShowResend(true);
        setResendEmail(form.email);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Request OTP for registration
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlertInfo({ show: false, severity: 'info', message: '' });

    try {
      const res = await axios.post(API.sendRegistrationOtp, {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.isSeller ? 'seller' : 'buyer'
      });

      setAlertInfo({
        show: true,
        severity: 'success',
        message: res.data.message || 'Verification code sent to your email.'
      });
      setRegisterStep(2);
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      const errorMsg =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        'Failed to initiate registration.';
      setAlertInfo({ show: true, severity: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and complete registration
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setAlertInfo({ show: true, severity: 'warning', message: 'Please enter the complete 6-digit verification code.' });
      return;
    }

    setLoading(true);
    setAlertInfo({ show: false, severity: 'info', message: '' });

    try {
      const res = await axios.post(API.verifyRegistrationOtp, {
        email: form.email.trim(),
        otp: fullOtp
      });

      setAlertInfo({
        show: true,
        severity: 'success',
        message: res.data.message || 'Registration verified! Logging in...'
      });

      if (res.data.token) {
        localStorage.setItem('jwt', res.data.token);
        setTimeout(() => {
          setToken(res.data.token);
        }, 800);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        'Verification failed. Please check the code.';
      setAlertInfo({ show: true, severity: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP for Step 2
  const handleResendOtp = async () => {
    if (!canResend || resendLoading) return;
    setResendLoading(true);
    setAlertInfo({ show: false, severity: 'info', message: '' });

    try {
      const res = await axios.post(API.resendRegistrationOtp, {
        email: form.email.trim()
      });
      setAlertInfo({
        show: true,
        severity: 'info',
        message: res.data.message || 'A fresh verification code has been sent to your email.'
      });
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      const errorMsg =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        'Could not resend verification code.';
      setAlertInfo({ show: true, severity: 'error', message: errorMsg });
    } finally {
      setResendLoading(false);
    }
  };

  // Legacy resend link helper
  const handleLegacyResend = async () => {
    const targetEmail = resendEmail || form.email;
    if (!targetEmail) {
      setAlertInfo({ show: true, severity: 'warning', message: 'Please enter your email to resend link' });
      return;
    }
    setResendLoading(true);
    try {
      const res = await axios.post(API.resendVerification, { email: targetEmail });
      setAlertInfo({
        show: true,
        severity: 'info',
        message: res.data.msg || 'Verification email resent! Please check your inbox.'
      });
      setShowResend(false);
    } catch (err) {
      setAlertInfo({
        show: true,
        severity: 'error',
        message: err.response?.data?.msg || 'Could not resend verification email'
      });
    } finally {
      setResendLoading(false);
    }
  };

  const toggleForm = () => {
    setFadeIn(false);
    setAlertInfo({ show: false, severity: 'info', message: '' });
    setShowResend(false);
    setRegisterStep(1);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setFadeIn(true);
    }, 250);
  };

  return (
    <Fade in={fadeIn}>
      <Box
        maxWidth={440}
        mx="auto"
        display="flex"
        flexDirection="column"
        gap={2}
        py={1}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#047857' }}>
          {isLogin
            ? 'Sign In to LocalMarket'
            : registerStep === 1
            ? 'Create an Account'
            : 'Verify Email Address'}
        </Typography>

        {alertInfo.show && (
          <Alert severity={alertInfo.severity} sx={{ borderRadius: 2 }}>
            {alertInfo.message}
          </Alert>
        )}

        {/* =========================================================================
            VIEW 1: SIGN IN FORM
            ========================================================================= */}
        {isLogin && (
          <Box component="form" onSubmit={handleLoginSubmit} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Email Address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              fullWidth
            />
            <Box display="flex" justifyContent="flex-end" mt={-1}>
              <Button
                size="small"
                onClick={() => setForgotOpen(true)}
                sx={{ textTransform: 'none', color: '#059669', fontSize: '0.82rem', fontWeight: 600, p: 0 }}
              >
                Forgot password?
              </Button>
            </Box>
            <Button
              variant="contained"
              type="submit"
              disabled={loading}
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                py: 1.2,
                mt: 1
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>
        )}

        {/* =========================================================================
            VIEW 2: REGISTRATION - STEP 1 (DETAILS)
            ========================================================================= */}
        {!isLogin && registerStep === 1 && (
          <Box component="form" onSubmit={handleRequestOtp} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Email Address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              helperText="Minimum 6 characters"
              required
              fullWidth
            />
            <FormControlLabel
              control={<Checkbox checked={form.isSeller} onChange={handleChange} name="isSeller" color="success" />}
              label="I want to register as a Seller / Service Provider"
            />
            <Button
              variant="contained"
              type="submit"
              disabled={loading}
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                py: 1.2,
                mt: 1
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Send Verification Code'
              )}
            </Button>
          </Box>
        )}

        {/* =========================================================================
            VIEW 3: REGISTRATION - STEP 2 (6-DIGIT OTP VERIFICATION)
            ========================================================================= */}
        {!isLogin && registerStep === 2 && (
          <Box component="form" onSubmit={handleVerifyOtp} display="flex" flexDirection="column" gap={2.5}>
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Enter the 6-digit verification code sent to:
              </Typography>
              <Typography variant="subtitle2" sx={{ color: '#047857', fontWeight: 700, mt: 0.5 }}>
                {form.email}
              </Typography>
              <Button
                size="small"
                onClick={() => {
                  setRegisterStep(1);
                  setAlertInfo({ show: false, severity: 'info', message: '' });
                }}
                sx={{ textTransform: 'none', color: '#64748B', fontSize: '0.8rem', mt: 0.5 }}
              >
                ← Edit registration details
              </Button>
            </Box>

            {/* 6 OTP Boxes */}
            <Box
              display="flex"
              justifyContent="center"
              gap={1}
              onPaste={handleOtpPaste}
            >
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  style={{
                    width: '46px',
                    height: '54px',
                    textAlign: 'center',
                    fontSize: '22px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    backgroundColor: '#F8FAFC',
                    border: '2px solid #CBD5E1',
                    borderRadius: '10px',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#059669')}
                  onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                />
              ))}
            </Box>

            <Typography variant="caption" align="center" color="text.secondary">
              Code expires in <strong>10 minutes</strong>
            </Typography>

            <Button
              variant="contained"
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                py: 1.2
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Verify & Complete Registration'
              )}
            </Button>

            {/* Resend OTP with countdown */}
            <Box display="flex" justifyContent="space-between" alignItems="center" px={1} pt={1}>
              <Typography variant="caption" color="text.secondary">
                Didn't receive code?
              </Typography>
              {canResend ? (
                <Button
                  size="small"
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  sx={{ color: '#059669', fontWeight: 600, textTransform: 'none' }}
                >
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </Button>
              ) : (
                <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600 }}>
                  Resend in {countdown}s
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {/* Switch Login / Register */}
        <Button variant="text" onClick={toggleForm} fullWidth sx={{ color: '#047857', fontWeight: 600 }}>
          {isLogin ? "Don't have an account? Register with Email OTP" : 'Already have an account? Sign In'}
        </Button>

        {isLogin && (
          <>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ textAlign: 'center' }}>
              <Button
                size="small"
                variant="text"
                color="secondary"
                onClick={() => setShowResend(!showResend)}
                sx={{ textTransform: 'none', fontSize: '0.85rem' }}
              >
                {showResend ? 'Hide resend verification' : 'Need to resend verification email?'}
              </Button>

              <Collapse in={showResend}>
                <Box sx={{ mt: 1.5, p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Registered Email"
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    sx={{ mb: 1.5 }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    fullWidth
                    disabled={resendLoading}
                    onClick={handleLegacyResend}
                    sx={{ borderColor: '#059669', color: '#059669' }}
                  >
                    {resendLoading ? 'Sending...' : 'Resend Verification Link'}
                  </Button>
                </Box>
              </Collapse>
            </Box>
          </>
        )}

        {/* Multi-step Forgot Password Modal */}
        <ForgotPasswordModal
          isOpen={forgotOpen}
          onClose={() => setForgotOpen(false)}
          onSwitchToLogin={() => {
            setIsLogin(true);
            setForgotOpen(false);
          }}
        />
      </Box>
    </Fade>
  );
};

export default AuthForms;
