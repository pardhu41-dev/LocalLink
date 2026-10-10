const express = require('express');
const router = express.Router();
const {
  sendRegistrationOtp,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword
} = require('../controllers/authController');

// Registration OTP
router.post('/send-registration-otp', sendRegistrationOtp);
router.post('/verify-registration-otp', verifyRegistrationOtp);
router.post('/resend-registration-otp', resendRegistrationOtp);

// Password Reset OTP
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

module.exports = router;