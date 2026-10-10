const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // Already bcrypt-hashed
  otpHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // Auto-deletes after 10 min
});

module.exports = mongoose.model('OtpVerification', otpVerificationSchema);