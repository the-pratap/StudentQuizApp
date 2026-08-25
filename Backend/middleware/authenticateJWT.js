const jwt = require('jsonwebtoken');
const User = require('../models/UserSchema');

const authenticateJWT = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        error: 'NO_TOKEN',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');

    // Fetch user from DB
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
        error: 'USER_NOT_FOUND',
      });
    }

    // Check if account is blocked
    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked by the administrator.',
        error: 'ACCOUNT_BLOCKED',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
        error: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or malformed token.',
      error: 'INVALID_TOKEN',
    });
  }
};

module.exports = authenticateJWT;
