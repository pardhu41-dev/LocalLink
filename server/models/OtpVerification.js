const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, unique: true },
  name: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  otpHash: { type: String, required: true },
  role: { type: String, default: 'buyer' },
  createdAt: { type: Date, default: Date.now, expires: 600 } // Auto-deleted after 10 mins (600s)
});

module.exports = mongoose.models.OtpVerification || mongoose.model('OtpVerification', otpVerificationSchema);