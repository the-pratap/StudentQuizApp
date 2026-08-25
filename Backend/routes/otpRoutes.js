const express = require('express');
const router = express.Router({ mergeParams: true });
const OTP = require('../models/OTPSchema');
const Exam = require('../models/ExamSchema');
const authenticateJWT = require('../middleware/authenticateJWT');
const checkAdmin = require('../middleware/checkAdmin');
const bcrypt = require('bcryptjs');

// @route   POST /api/exams/:examId/otp/generate
// @desc    Generate/Regenerate OTP for an exam (Admin only)
// @access  Private (Admin)
router.post('/exams/:examId/otp/generate', authenticateJWT, checkAdmin, async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { validityHours = 24 } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
        error: 'EXAM_NOT_FOUND',
      });
    }

    // Invalidate previous OTPs for this exam
    await OTP.updateMany({ examId, isActive: true }, { isActive: false });

    // Generate random 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);

    const expiresAt = new Date(Date.now() + validityHours * 60 * 60 * 1000);

    const newOtp = await OTP.create({
      examId,
      otpHash,
      rawOtp,
      expiresAt,
      isActive: true,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'New OTP generated successfully',
      data: {
        otp: rawOtp,
        expiresAt: newOtp.expiresAt,
        createdAt: newOtp.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/exams/:examId/otp/current
// @desc    Get currently active OTP for an exam (Admin only)
// @access  Private (Admin)
router.get('/exams/:examId/otp/current', authenticateJWT, checkAdmin, async (req, res, next) => {
  try {
    const { examId } = req.params;

    const activeOtp = await OTP.findOne({ examId, isActive: true }).sort({ createdAt: -1 });
    if (!activeOtp) {
      return res.status(404).json({
        success: false,
        message: 'No active OTP found for this exam. Please generate one.',
        error: 'NO_ACTIVE_OTP',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        otp: activeOtp.rawOtp,
        expiresAt: activeOtp.expiresAt,
        createdAt: activeOtp.createdAt,
        isExpired: new Date() > activeOtp.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/exams/:examId/otp/verify
// @desc    Verify OTP entered by student
// @access  Private (Student)
router.post('/exams/:examId/otp/verify', authenticateJWT, async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Please enter the 6-digit OTP provided by your administrator.',
        error: 'MISSING_OTP',
      });
    }

    const activeOtp = await OTP.findOne({ examId, isActive: true }).sort({ createdAt: -1 });
    if (!activeOtp) {
      return res.status(400).json({
        success: false,
        message: 'No active OTP configured for this exam.',
        error: 'NO_ACTIVE_OTP',
      });
    }

    // Check expiration
    if (new Date() > activeOtp.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'This OTP has expired. Please request a new one from your administrator.',
        error: 'OTP_EXPIRED',
      });
    }

    // Verify hash
    const isMatch = await activeOtp.verifyOTP(otp.toString().trim());
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.',
        error: 'INVALID_OTP',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
