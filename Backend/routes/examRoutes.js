const express = require('express');
const router = express.Router();
const Exam = require('../models/ExamSchema');
const Question = require('../models/QuestionSchema');
const Attempt = require('../models/AttemptSchema');
const OTP = require('../models/OTPSchema');
const authenticateJWT = require('../middleware/authenticateJWT');
const checkAdmin = require('../middleware/checkAdmin');
const bcrypt = require('bcryptjs');

// Helper to compute startDateTime from examDate and startTime
const calculateStartDateTime = (examDateStr, startTimeStr) => {
  try {
    // examDateStr format: "YYYY-MM-DD"
    // startTimeStr format: "HH:mm" or "HH:mm AM/PM"
    let [year, month, day] = examDateStr.split('-').map(Number);
    let hours = 0;
    let minutes = 0;

    const is12Hour = /AM|PM/i.test(startTimeStr);
    if (is12Hour) {
      const match = startTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        const meridiem = match[3].toUpperCase();
        if (meridiem === 'PM' && hours < 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;
      }
    } else {
      const [h, m] = startTimeStr.split(':').map(Number);
      hours = h || 0;
      minutes = m || 0;
    }

    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return date;
  } catch (err) {
    return new Date();
  }
};

// Helper to compute dynamic status
const getDynamicStatus = (exam) => {
  const now = new Date();
  const start = new Date(exam.startDateTime);
  const end = new Date(start.getTime() + (exam.durationMinutes || 10) * 60 * 1000);

  if (now < start) {
    return 'UPCOMING';
  } else if (now >= start && now <= end) {
    return 'ACTIVE';
  } else {
    return 'COMPLETED';
  }
};

// @route   GET /api/exams
// @desc    Get all exams (with dynamic status and attempt status for students)
// @access  Private (Student & Admin)
router.get('/', authenticateJWT, async (req, res, next) => {
  try {
    const exams = await Exam.find().sort({ startDateTime: 1 }).populate('createdBy', 'name email');

    // If student, check which exams they have already attempted
    let studentAttempts = [];
    if (req.user.role === 'student') {
      studentAttempts = await Attempt.find({ studentId: req.user._id }).select('examId status score percentage submittedAt');
    }

    const attemptMap = {};
    studentAttempts.forEach((att) => {
      attemptMap[att.examId.toString()] = att;
    });

    // Also get active OTPs if user is Admin
    let otpMap = {};
    if (req.user.role === 'admin') {
      const activeOTPs = await OTP.find({ isActive: true });
      activeOTPs.forEach((otp) => {
        otpMap[otp.examId.toString()] = otp.rawOtp;
      });
    }

    const formattedExams = exams.map((exam) => {
      const dynStatus = getDynamicStatus(exam);
      const attempt = attemptMap[exam._id.toString()] || null;
      const questionCount = exam.totalQuestions || 50;

      return {
        id: exam._id,
        title: exam.title,
        description: exam.description,
        subject: exam.subject,
        examDate: exam.examDate,
        startTime: exam.startTime,
        startDateTime: exam.startDateTime,
        durationMinutes: exam.durationMinutes,
        totalQuestions: questionCount,
        status: dynStatus,
        resultReleased: exam.resultReleased,
        createdBy: exam.createdBy,
        createdAt: exam.createdAt,
        activeOtp: req.user.role === 'admin' ? otpMap[exam._id.toString()] || null : undefined,
        studentAttempt: attempt
          ? {
              status: attempt.status,
              submittedAt: attempt.submittedAt,
              score: exam.resultReleased ? attempt.score : undefined,
              percentage: exam.resultReleased ? attempt.percentage : undefined,
            }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedExams,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/exams/:id
// @desc    Get single exam details
// @access  Private
router.get('/:id', authenticateJWT, async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('createdBy', 'name email');
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
        error: 'EXAM_NOT_FOUND',
      });
    }

    const dynStatus = getDynamicStatus(exam);
    let studentAttempt = null;

    if (req.user.role === 'student') {
      const attempt = await Attempt.findOne({ studentId: req.user._id, examId: exam._id });
      if (attempt) {
        studentAttempt = {
          attemptId: attempt._id,
          status: attempt.status,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          score: exam.resultReleased ? attempt.score : undefined,
          percentage: exam.resultReleased ? attempt.percentage : undefined,
        };
      }
    }

    let activeOtp = null;
    if (req.user.role === 'admin') {
      const otp = await OTP.findOne({ examId: exam._id, isActive: true });
      if (otp) {
        activeOtp = otp.rawOtp;
      }
    }

    const questionCount = await Question.countDocuments({ examId: exam._id });

    return res.status(200).json({
      success: true,
      data: {
        id: exam._id,
        title: exam.title,
        description: exam.description,
        subject: exam.subject,
        examDate: exam.examDate,
        startTime: exam.startTime,
        startDateTime: exam.startDateTime,
        durationMinutes: exam.durationMinutes,
        totalQuestions: questionCount || exam.totalQuestions || 50,
        status: dynStatus,
        resultReleased: exam.resultReleased,
        createdBy: exam.createdBy,
        createdAt: exam.createdAt,
        activeOtp,
        studentAttempt,
      },
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/exams
// @desc    Create a new exam (Admin only)
// @access  Private (Admin)
router.post('/', authenticateJWT, checkAdmin, async (req, res, next) => {
  try {
    const {
      title,
      description,
      subject,
      examDate,
      startTime,
      durationMinutes = 10,
      totalQuestions = 50,
    } = req.body;

    if (!title || !subject || !examDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Title, subject, exam date, and start time are required.',
        error: 'MISSING_FIELDS',
      });
    }

    const startDateTime = calculateStartDateTime(examDate, startTime);

    const exam = await Exam.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      subject: subject.trim(),
      examDate,
      startTime,
      startDateTime,
      durationMinutes: Number(durationMinutes) || 10,
      totalQuestions: Number(totalQuestions) || 50,
      status: 'UPCOMING',
      resultReleased: false,
      createdBy: req.user._id,
    });

    // Auto-generate an initial 6-digit OTP for this exam
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(generatedOtp, salt);

    // Set OTP expiration to 24 hours after exam start time
    const expiresAt = new Date(startDateTime.getTime() + 24 * 60 * 60 * 1000);

    const otpRecord = await OTP.create({
      examId: exam._id,
      otpHash,
      rawOtp: generatedOtp,
      expiresAt,
      isActive: true,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Exam created successfully with active OTP',
      data: {
        exam: {
          id: exam._id.toString(),
          _id: exam._id.toString(),
          title: exam.title,
          description: exam.description,
          subject: exam.subject,
          examDate: exam.examDate,
          startTime: exam.startTime,
          startDateTime: exam.startDateTime,
          durationMinutes: exam.durationMinutes,
          totalQuestions: exam.totalQuestions,
          status: exam.status,
          resultReleased: exam.resultReleased,
          activeOtp: generatedOtp,
        },
        otp: generatedOtp,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/exams/:id
// @desc    Update an exam (Admin only)
// @access  Private (Admin)
router.put('/:id', authenticateJWT, checkAdmin, async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
        error: 'EXAM_NOT_FOUND',
      });
    }

    const {
      title,
      description,
      subject,
      examDate,
      startTime,
      durationMinutes,
      totalQuestions,
      resultReleased,
    } = req.body;

    if (title) exam.title = title.trim();
    if (description !== undefined) exam.description = description.trim();
    if (subject) exam.subject = subject.trim();
    if (durationMinutes) exam.durationMinutes = Number(durationMinutes);
    if (totalQuestions) exam.totalQuestions = Number(totalQuestions);
    if (resultReleased !== undefined) exam.resultReleased = Boolean(resultReleased);

    if (examDate || startTime) {
      const newDate = examDate || exam.examDate;
      const newTime = startTime || exam.startTime;
      exam.examDate = newDate;
      exam.startTime = newTime;
      exam.startDateTime = calculateStartDateTime(newDate, newTime);
    }

    await exam.save();

    return res.status(200).json({
      success: true,
      message: 'Exam updated successfully',
      data: exam,
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/exams/:id
// @desc    Delete an exam and cascade delete its questions, attempts, and OTPs (Admin only)
// @access  Private (Admin)
router.delete('/:id', authenticateJWT, checkAdmin, async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
        error: 'EXAM_NOT_FOUND',
      });
    }

    // Cascade delete questions, attempts, OTPs
    await Promise.all([
      Exam.findByIdAndDelete(req.params.id),
      Question.deleteMany({ examId: req.params.id }),
      Attempt.deleteMany({ examId: req.params.id }),
      OTP.deleteMany({ examId: req.params.id }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Exam and associated questions, attempts, and OTPs deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
