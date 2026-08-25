const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/UserSchema');
const authenticateJWT = require('../middleware/authenticateJWT');

// Helper to generate JWT
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'fallback_secret_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new student
// @access  Public
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.',
        error: 'MISSING_FIELDS',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
        error: 'PASSWORD_MISMATCH',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
        error: 'WEAK_PASSWORD',
      });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
        error: 'EMAIL_ALREADY_EXISTS',
      });
    }

    // Allowed role (defaults to student, can register admin if explicitly passed or via admin seed)
    const userRole = role === 'admin' ? 'admin' : 'student';

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: userRole,
      status: 'active',
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
// @desc    Login student or admin
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
        error: 'MISSING_CREDENTIALS',
      });
    }

    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        error: 'INVALID_CREDENTIALS',
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        error: 'INVALID_CREDENTIALS',
      });
    }

    // Verify account is not blocked
    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked by the administrator.',
        error: 'ACCOUNT_BLOCKED',
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', authenticateJWT, async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'User profile retrieved',
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status,
        createdAt: req.user.createdAt,
      },
    },
  });
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateJWT, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = router;
