const User = require('../models/User');

/**
 * Middleware to check if the authenticated user has verified their email address.
 * Must be used AFTER the auth middleware (requires req.user.id).
 */
module.exports = async function isVerified(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'Authentication required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User account not found' });
    }

    // In local development or if user is already verified, allow access
    const isDev = process.env.NODE_ENV === 'development';
    if (!user.isVerified) {
      if (isDev) {
        // Auto-verify in development mode so local developers/testers are not blocked
        user.isVerified = true;
        await user.save();
      } else {
        return res.status(403).json({
          msg: 'Please verify your email address to access this feature.',
          isVerified: false
        });
      }
    }

    // Attach verified user details to request
    req.userDoc = user;
    next();
  } catch (err) {
    console.error('isVerified middleware error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
