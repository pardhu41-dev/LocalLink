const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendVerificationEmail } = require('../utils/sendEmail');

const {
  sendRegistrationOtp,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword
} = require('../controllers/authController');

// ─── Helper: hash a raw token for safe DB storage ───────────────────────────
const hashToken = (rawToken) =>
  crypto.createHash('sha256').update(rawToken).digest('hex');

// ─── Email OTP Registration Workflow ─────────────────────────────────────────
// POST /api/auth/send-registration-otp
router.post('/send-registration-otp', sendRegistrationOtp);

// POST /api/auth/verify-registration-otp
router.post('/verify-registration-otp', verifyRegistrationOtp);

// POST /api/auth/resend-registration-otp
router.post('/resend-registration-otp', resendRegistrationOtp);

// ─── Password Reset (Forgot Password) Workflow ──────────────────────────────
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);


// ─── Register ────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Name, email and password are required' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate a cryptographically secure raw token (sent in email URL)
    const rawToken = crypto.randomBytes(32).toString('hex');
    // Store only the hash — never the raw token
    const hashedVerificationToken = hashToken(rawToken);

    user = new User({
      name,
      email,
      password: hashedPassword,
      verificationToken: hashedVerificationToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      isVerified: false
    });

    await user.save();

    // Send verification email (non-blocking — don't fail registration if email fails)
    try {
      await sendVerificationEmail(email, name, rawToken);
    } catch (emailErr) {
      console.error('[Register] Email send failed (non-fatal):', emailErr.message);
    }

    // Return a limited JWT — user can browse but isVerified gates protected actions
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      },
      msg: 'Registration successful! Check your email to verify your account.'
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── Verify Email ─────────────────────────────────────────────────────────────
// GET /api/users/verify-email?token=<rawToken>
router.get('/verify-email', async (req, res) => {
  try {
    const { token: rawToken } = req.query;

    if (!rawToken) {
      return res.status(400).json({ msg: 'Verification token is required' });
    }

    // Hash the incoming raw token and look it up
    const hashedToken = hashToken(rawToken);

    // Use +select to bring back the hidden fields for this one query
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() } // must not be expired
    }).select('+verificationToken +verificationTokenExpires');

    if (!user) {
      return res.status(400).json({
        msg: 'Invalid or expired verification link. Please request a new one.'
      });
    }

    if (user.isVerified) {
      return res.status(200).json({ msg: 'Email already verified. You can log in.' });
    }

    // Mark verified and clear the token fields
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({
      msg: 'Email verified successfully! You can now log in.',
      isVerified: true
    });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── Resend Verification Email ────────────────────────────────────────────────
// POST /api/users/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });

    const user = await User.findOne({ email })
      .select('+verificationToken +verificationTokenExpires');

    // Don't reveal whether the user exists
    if (!user || user.isVerified) {
      return res.status(200).json({
        msg: 'If that email is registered and unverified, a new link has been sent.'
      });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = hashToken(rawToken);
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    await sendVerificationEmail(email, user.name, rawToken);

    res.status(200).json({
      msg: 'If that email is registered and unverified, a new link has been sent.'
    });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── Login ───────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── Get current user profile ─────────────────────────────────────────────────
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── Update user profile ──────────────────────────────────────────────────────
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, address, bio, profilePhoto } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, address, bio, profilePhoto },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
