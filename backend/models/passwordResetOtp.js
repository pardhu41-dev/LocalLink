const mongoose = require('mongoose');

const passwordResetOtpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  otpHash: { type: String, required: true },
  isVerified: { type: Boolean, default: false }, // Flipped to true once OTP is verified
  createdAt: { type: Date, default: Date.now, expires: 600 } // Auto-deleted after 10 mins (TTL index)
});

module.exports = mongoose.model('PasswordResetOtp', passwordResetOtpSchema);