const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OtpVerification = require('../models/OtpVerification');
const PasswordResetOtp = require('../models/passwordResetOtp');
const { sendOtpEmail } = require('../utils/sendOtpEmail');
const { sendPasswordResetOtpEmail } = require('../utils/sendPasswordResetEmail');

// Helper to compute SHA-256 hash of OTP string
const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
};

// =========================================================================
// REGISTRATION OTP FLOW
// =========================================================================

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

// =========================================================================
// PASSWORD RESET (FORGOT PASSWORD) FLOW
// =========================================================================

// 1. Request Password Reset OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required.', msg: 'Email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        error: 'No account found with this email address.',
        msg: 'No account found with this email address.'
      });
    }

    // Generate 6-digit numeric OTP & SHA-256 hash
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashOtp(rawOtp);

    await PasswordResetOtp.findOneAndUpdate(
      { email: normalizedEmail },
      { otpHash, isVerified: false, createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendPasswordResetOtpEmail(normalizedEmail, rawOtp);

    return res.status(200).json({
      message: 'Reset code sent to your email.',
      msg: 'Reset code sent to your email.'
    });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    return res.status(500).json({
      error: 'Failed to send reset code. Please check email settings.',
      msg: 'Failed to send reset code. Please check email settings.'
    });
  }
};

// 2. Verify Reset Code
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        error: 'Email and verification code are required.',
        msg: 'Email and verification code are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = await PasswordResetOtp.findOne({ email: normalizedEmail });

    if (!record) {
      return res.status(400).json({
        error: 'Reset code expired or not found. Please request a new one.',
        msg: 'Reset code expired or not found. Please request a new one.'
      });
    }

    const inputHash = hashOtp(otp);
    if (inputHash !== record.otpHash) {
      return res.status(400).json({
        error: 'Invalid verification code.',
        msg: 'Invalid verification code.'
      });
    }

    // Mark as verified so client can proceed to enter new password
    record.isVerified = true;
    await record.save();

    return res.status(200).json({
      message: 'Code verified successfully. Enter your new password.',
      msg: 'Code verified successfully. Enter your new password.'
    });
  } catch (err) {
    console.error('Verify Reset OTP Error:', err);
    return res.status(500).json({
      error: 'Verification failed.',
      msg: 'Verification failed.'
    });
  }
};

// 3. Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({
        error: 'Email and new password are required.',
        msg: 'Email and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters.',
        msg: 'Password must be at least 6 characters.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = await PasswordResetOtp.findOne({ email: normalizedEmail, isVerified: true });

    if (!record) {
      return res.status(400).json({
        error: 'Unauthorized or verification session expired. Please start over.',
        msg: 'Unauthorized or verification session expired. Please start over.'
      });
    }

    // Hash new password and update user document
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findOneAndUpdate(
      { email: normalizedEmail },
      { password: hashedPassword }
    );

    // Clean up temporary reset record
    await PasswordResetOtp.deleteOne({ _id: record._id });

    return res.status(200).json({
      message: 'Password reset successful! You can now log in.',
      msg: 'Password reset successful! You can now log in.'
    });
  } catch (err) {
    console.error('Reset Password Error:', err);
    return res.status(500).json({
      error: 'Failed to reset password.',
      msg: 'Failed to reset password.'
    });
  }
};