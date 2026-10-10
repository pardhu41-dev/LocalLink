const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OtpVerification = require('../models/OtpVerification');
const { sendOtpEmail } = require('../utils/sendOtpEmail');

// Helper to compute SHA-256 hash of OTP string
const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
};

// Step 1: Send Registration OTP
exports.sendRegistrationOtp = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required.', msg: 'Full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Valid email is required.', msg: 'Valid email is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.', msg: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists and is verified
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        error: 'An account with this email already exists and is verified.',
        msg: 'An account with this email already exists and is verified.'
      });
    }

    // Generate 6-digit numeric OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashOtp(rawOtp);

    // Hash user password before temporary storage (10 salt rounds)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save or update pending verification record
    await OtpVerification.findOneAndUpdate(
      { email: normalizedEmail },
      {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        otpHash,
        role: role === 'seller' ? 'seller' : 'buyer',
        createdAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Dispatch email
    await sendOtpEmail(normalizedEmail, rawOtp);

    return res.status(200).json({
      message: 'Verification OTP sent to your email.',
      msg: 'Verification OTP sent to your email.',
      email: normalizedEmail
    });
  } catch (err) {
    console.error('Error in sendRegistrationOtp:', err);
    return res.status(500).json({
      error: 'Failed to send OTP. Check SMTP settings.',
      msg: 'Failed to send OTP. Check SMTP settings.'
    });
  }
};

// Step 2: Verify OTP and finalize registration
exports.verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        error: 'Email and verification code are required.',
        msg: 'Email and verification code are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const pending = await OtpVerification.findOne({ email: normalizedEmail });

    if (!pending) {
      return res.status(400).json({
        error: 'OTP expired or registration request not found.',
        msg: 'OTP expired or registration request not found.'
      });
    }

    const inputHash = hashOtp(otp);
    if (inputHash !== pending.otpHash) {
      return res.status(400).json({
        error: 'Incorrect verification code.',
        msg: 'Incorrect verification code.'
      });
    }

    // Persist finalized user (update unverified or create new)
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      user.name = pending.name;
      user.password = pending.password;
      user.role = pending.role || user.role || 'buyer';
      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      await user.save();
    } else {
      user = new User({
        name: pending.name,
        email: pending.email,
        password: pending.password,
        role: pending.role || 'buyer',
        isVerified: true
      });
      await user.save();
    }

    // Clean up temporary record
    await OtpVerification.deleteOne({ _id: pending._id });

    // Generate JWT auth session
    const token = jwt.sign(
      { userId: user._id || user.id },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      message: 'Account successfully registered and verified!',
      msg: 'Account successfully registered and verified!',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    console.error('Error in verifyRegistrationOtp:', err);
    return res.status(500).json({
      error: err.message,
      msg: err.message
    });
  }
};

// Step 3: Resend Registration OTP (60s cooldown rate-limited)
exports.resendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        error: 'Email is required to resend verification code.',
        msg: 'Email is required to resend verification code.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const pending = await OtpVerification.findOne({ email: normalizedEmail });

    if (!pending) {
      return res.status(400).json({
        error: 'No pending registration found for this email. Please register again.',
        msg: 'No pending registration found for this email. Please register again.'
      });
    }

    // 60-second cooldown check
    const timeSinceLast = Date.now() - new Date(pending.createdAt).getTime();
    const COOLDOWN_MS = 60 * 1000;

    if (timeSinceLast < COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((COOLDOWN_MS - timeSinceLast) / 1000);
      return res.status(429).json({
        error: `Please wait ${remainingSeconds} second(s) before requesting another code.`,
        msg: `Please wait ${remainingSeconds} second(s) before requesting another code.`,
        remainingSeconds
      });
    }

    // Generate fresh OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    pending.otpHash = hashOtp(rawOtp);
    pending.createdAt = new Date();
    await pending.save();

    await sendOtpEmail(normalizedEmail, rawOtp);

    return res.status(200).json({
      message: 'A fresh verification code has been sent to your email.',
      msg: 'A fresh verification code has been sent to your email.',
      email: normalizedEmail
    });
  } catch (err) {
    console.error('Error in resendRegistrationOtp:', err);
    return res.status(500).json({
      error: 'Failed to resend verification code.',
      msg: 'Failed to resend verification code.'
    });
  }
};