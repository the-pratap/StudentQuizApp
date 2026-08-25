const express = require('express');
const router = express.Router();
const User = require('../models/UserSchema');
const Exam = require('../models/ExamSchema');
const Attempt = require('../models/AttemptSchema');
const Question = require('../models/QuestionSchema');
const authenticateJWT = require('../middleware/authenticateJWT');
const checkStudent = require('../middleware/checkStudent');

// @route   GET /api/students/profile
// @desc    Get student profile with performance summary
// @access  Private (Student)
router.get('/profile', authenticateJWT, checkStudent, async (req, res, next) => {
  try {
    const studentId = req.user._id;

    const attempts = await Attempt.find({ studentId }).populate('examId', 'title subject examDate resultReleased');

    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter((a) => a.status === 'submitted' || a.status === 'evaluated');
    
    // Only calculate average from released results
    const releasedAttempts = attempts.filter((a) => a.examId && a.examId.resultReleased);
    const totalScore = releasedAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
    const totalPossible = releasedAttempts.reduce((acc, a) => acc + (a.totalMarks || 50), 0);
    const avgPercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          status: req.user.status,
          createdAt: req.user.createdAt,
        },
        stats: {
          totalAttempts,
          completedAttempts: completedAttempts.length,
          releasedResultsCount: releasedAttempts.length,
          averagePercentage: avgPercentage,
          totalScoreObtained: totalScore,
          totalPossibleMarks: totalPossible,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/students/attempts
// @desc    Get all exam attempts for the logged-in student
// @access  Private (Student)
router.get('/attempts', authenticateJWT, checkStudent, async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const attempts = await Attempt.find({ studentId })
      .populate('examId', 'title subject examDate startTime durationMinutes totalQuestions resultReleased')
      .sort({ createdAt: -1 });

    const formattedAttempts = attempts.map((att) => {
      const exam = att.examId;
      const isReleased = exam ? exam.resultReleased : false;

      return {
        id: att._id,
        exam: exam
          ? {
              id: exam._id,
              title: exam.title,
              subject: exam.subject,
              examDate: exam.examDate,
              startTime: exam.startTime,
              durationMinutes: exam.durationMinutes,
              totalQuestions: exam.totalQuestions,
              resultReleased: isReleased,
            }
          : null,
        startedAt: att.startedAt,
        submittedAt: att.submittedAt,
        durationSpentSeconds: att.durationSpentSeconds,
        submissionType: att.submissionType,
        status: att.status,
        score: isReleased ? att.score : undefined,
        totalMarks: isReleased ? att.totalMarks : undefined,
        percentage: isReleased ? att.percentage : undefined,
        resultReleased: isReleased,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedAttempts.length,
      data: formattedAttempts,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/students/results
// @desc    Get only released exam results for the student
// @access  Private (Student)
router.get('/results', authenticateJWT, checkStudent, async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const attempts = await Attempt.find({ studentId })
      .populate({
        path: 'examId',
        match: { resultReleased: true },
        select: 'title subject examDate startTime durationMinutes totalQuestions resultReleased',
      })
      .sort({ submittedAt: -1 });

    // Filter out attempts where exam was not matched (result not released)
    const releasedAttempts = attempts.filter((att) => att.examId !== null);

    const formatted = releasedAttempts.map((att) => ({
      attemptId: att._id,
      exam: {
        id: att.examId._id,
        title: att.examId.title,
        subject: att.examId.subject,
        examDate: att.examId.examDate,
        startTime: att.examId.startTime,
      },
      score: att.score,
      totalMarks: att.totalMarks,
      percentage: att.percentage,
      correctCount: att.correctCount,
      wrongCount: att.wrongCount,
      unansweredCount: att.unansweredCount,
      submittedAt: att.submittedAt,
      durationSpentSeconds: att.durationSpentSeconds,
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/students/leaderboard/:examId
// @desc    Get leaderboard for a specific exam (ONLY accessible if result is released)
// @access  Private
router.get('/leaderboard/:examId', authenticateJWT, async (req, res, next) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
        error: 'EXAM_NOT_FOUND',
      });
    }

    // STRICT CHECK: Leaderboard hidden until Admin releases result
    if (!exam.resultReleased && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Leaderboard is not available yet. Results have not been released by the administrator.',
        error: 'RESULT_NOT_RELEASED',
        resultReleased: false,
      });
    }

    // Fetch all submitted attempts for this exam, sorted by score DESC, then duration ASC
    const attempts = await Attempt.find({
      examId,
      status: { $in: ['submitted', 'evaluated'] },
    })
      .populate('studentId', 'name email')
      .sort({ score: -1, durationSpentSeconds: 1, submittedAt: 1 });

    let currentRank = 1;
    const leaderboard = attempts.map((att, index) => {
      const student = att.studentId;
      const rank = index + 1;

      return {
        rank,
        studentId: student ? student._id : 'N/A',
        studentName: student ? student.name : 'Unknown Student',
        studentEmail: student ? student.email : 'N/A',
        score: att.score,
        totalMarks: att.totalMarks,
        percentage: att.percentage,
        durationSpentSeconds: att.durationSpentSeconds,
        submittedAt: att.submittedAt,
        isCurrentUser: student && req.user ? student._id.toString() === req.user._id.toString() : false,
      };
    });

    return res.status(200).json({
      success: true,
      exam: {
        id: exam._id,
        title: exam.title,
        subject: exam.subject,
        examDate: exam.examDate,
        totalQuestions: exam.totalQuestions,
        resultReleased: exam.resultReleased,
      },
      totalParticipants: leaderboard.length,
      data: leaderboard,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
