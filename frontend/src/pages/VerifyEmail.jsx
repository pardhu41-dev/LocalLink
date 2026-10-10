import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  TextField,
  Alert,
  Fade,
  Stack
} from '@mui/material';
import {
  CheckCircleOutline as CheckIcon,
  ErrorOutline as ErrorIcon,
  MarkEmailRead as EmailIcon,
  ArrowForward as ArrowForwardIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { API } from '../config';

const VerifyEmail = ({ onOpenLogin }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState({ loading: false, success: false, message: '' });

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in URL. Please use the link sent to your email or request a new one below.');
      return;
    }

    let isMounted = true;

    const verifyToken = async () => {
      try {
        const res = await axios.get(API.verifyEmail(token));
        if (isMounted) {
          setStatus('success');
          setMessage(res.data.msg || 'Your email has been verified successfully!');
        }
      } catch (err) {
        if (isMounted) {
          setStatus('error');
          setMessage(
            err.response?.data?.msg ||
            'Verification link is invalid or has expired (links expire after 24 hours).'
          );
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResendStatus({ loading: true, success: false, message: '' });
    try {
      const res = await axios.post(API.resendVerification, { email: resendEmail });
      setResendStatus({
        loading: false,
        success: true,
        message: res.data.msg || 'If that account exists, a new verification link has been sent!'
      });
    } catch (err) {
      setResendStatus({
        loading: false,
        success: false,
        message: err.response?.data?.msg || 'Could not send verification email. Please try again.'
      });
    }
  };

  return (
    <Box
      sx={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 6
      }}
    >
      <Fade in timeout={600}>
        <Card
          sx={{
            maxWidth: 520,
            width: '100%',
            borderRadius: 4,
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            border: '1px solid rgba(46, 125, 50, 0.12)'
          }}
        >
          {/* Top Decorative Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
              py: 4,
              px: 3,
              textAlign: 'center',
              color: 'white'
            }}
          >
            <EmailIcon sx={{ fontSize: 52, color: '#AEEA00', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
              Email Verification
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
              LocalLink Community Marketplace
            </Typography>
          </Box>

          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            {status === 'loading' && (
              <Box sx={{ py: 4 }}>
                <CircularProgress size={56} sx={{ color: '#2E7D32', mb: 3 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                  Verifying your email...
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  Please wait while we confirm your security token.
                </Typography>
              </Box>
            )}

            {status === 'success' && (
              <Box sx={{ py: 2 }}>
                <CheckIcon sx={{ fontSize: 72, color: '#2E7D32', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1B5E20', mb: 1.5 }}>
                  Email Verified!
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.6 }}>
                  {message}
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                  {onOpenLogin ? (
                    <Button
                      variant="contained"
                      size="large"
                      onClick={onOpenLogin}
                      sx={{
                        background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                        color: '#AEEA00',
                        fontWeight: 700,
                        px: 4,
                        '&:hover': { background: '#1B5E20' }
                      }}
                    >
                      Login Now
                    </Button>
                  ) : null}
                  <Button
                    variant="outlined"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/')}
                    sx={{
                      borderColor: '#2E7D32',
                      color: '#2E7D32',
                      fontWeight: 600,
                      '&:hover': { borderColor: '#1B5E20', backgroundColor: 'rgba(46,125,50,0.04)' }
                    }}
                  >
                    Go to Marketplace
                  </Button>
                </Stack>
              </Box>
            )}

            {status === 'error' && (
              <Box sx={{ py: 1 }}>
                <ErrorIcon sx={{ fontSize: 68, color: '#d32f2f', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#d32f2f', mb: 1.5 }}>
                  Verification Failed
                </Typography>
                <Alert severity="error" sx={{ mb: 3, textAlign: 'left', borderRadius: 2 }}>
                  {message}
                </Alert>

                {/* Resend Verification Form */}
                <Box
                  component="form"
                  onSubmit={handleResend}
                  sx={{
                    mt: 3,
                    p: 2.5,
                    bgcolor: 'rgba(0,0,0,0.02)',
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.06)'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#333' }}>
                    Need a new verification link?
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontSize: '0.85rem' }}>
                    Enter your registered email and we'll send a fresh activation link.
                  </Typography>

                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Your Email Address"
                      type="email"
                      required
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={resendStatus.loading}
                      startIcon={resendStatus.loading ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                      sx={{
                        background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                        color: '#AEEA00',
                        fontWeight: 700
                      }}
                    >
                      {resendStatus.loading ? 'Sending...' : 'Send New Link'}
                    </Button>
                  </Stack>

                  {resendStatus.message && (
                    <Alert
                      severity={resendStatus.success ? 'success' : 'error'}
                      sx={{ mt: 2, textAlign: 'left' }}
                    >
                      {resendStatus.message}
                    </Alert>
                  )}
                </Box>

                <Button
                  variant="text"
                  sx={{ mt: 3, color: '#2E7D32', fontWeight: 600 }}
                  onClick={() => navigate('/')}
                >
                  Return to Home
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

export default VerifyEmail;
