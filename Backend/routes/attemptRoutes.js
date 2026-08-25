const express = require('express');
const router = express.Router();
const Attempt = require('../models/AttemptSchema');
const Exam = require('../models/ExamSchema');
const Question = require('../models/QuestionSchema');
const OTP = require('../models/OTPSchema');
const authenticateJWT = require('../middleware/authenticateJWT');
const checkStudent = require('../middleware/checkStudent');

// @route   POST /api/exams/:examId/start
// @desc    Start an exam attempt (Validates Server Time, OTP, Single Attempt)
// @access  Private (Student)
router.post('/exams/:examId/start', authenticateJWT, checkStudent, async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { otp } = req.body;
    const studentId = req.user._id;

    // 1. Verify Exam Exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
        error: 'EXAM_NOT_FOUND',
      });
    }

    // 2. Server-side Exam Start Time validation (DO NOT TRUST CLIENT TIME)
    const now = new Date();
    const startDateTime = new Date(exam.startDateTime);
    if (now < startDateTime) {
      return res.status(400).json({
        success: false,
        message: `Exam has not started yet. Scheduled to start at ${exam.startTime} on ${exam.examDate}.`,
        error: 'EXAM_NOT_STARTED',
        startTime: exam.startTime,
        examDate: exam.examDate,
      });
    }

    // 3. Verify OTP
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Exam OTP is required to start the exam.',
        error: 'MISSING_OTP',
      });
    }

    const activeOtp = await OTP.findOne({ examId, isActive: true }).sort({ createdAt: -1 });
    if (!activeOtp) {
      return res.status(400).json({
        success: false,
        message: 'No active OTP available for this exam. Please contact the administrator.',
        error: 'NO_ACTIVE_OTP',
      });
    }

    if (now > activeOtp.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'The OTP for this exam has expired. Please contact the administrator.',
        error: 'OTP_EXPIRED',
      });
    }

    const isOtpValid = await activeOtp.verifyOTP(otp.toString().trim());
    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please enter the correct OTP to start.',
        error: 'INVALID_OTP',
      });
    }

    // 4. Verify Single Attempt Rule (Database and Logic Enforcement)
    const existingAttempt = await Attempt.findOne({ studentId, examId });
    if (existingAttempt) {
      return res.status(400).json({
        success: false,
        message: 'You have already attempted this exam. Only one attempt is allowed.',
        error: 'ALREADY_ATTEMPTED',
        attemptId: existingAttempt._id,
        status: existingAttempt.status,
      });
    }

    // 5. Fetch Questions (Sanitized - no correct answers!)
    const questions = await Question.find({ examId }).sort({ questionNumber: 1 });
    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No questions have been configured for this exam yet.',
        error: 'NO_QUESTIONS',
      });
    }

    // 6. Create Attempt Record
    const attempt = await Attempt.create({
      studentId,
      examId,
      startedAt: now,
      status: 'started',
      totalMarks: questions.reduce((acc, q) => acc + (q.marks || 1), 0),
    });

    const sanitizedQuestions = questions.map((q) => ({
      id: q._id,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      options: q.options,
      marks: q.marks || 1,
    }));

    return res.status(201).json({
      success: true,
      message: 'Exam started successfully. Best of luck!',
      data: {
        attemptId: attempt._id,
        startedAt: attempt.startedAt,
        durationMinutes: exam.durationMinutes,
        totalQuestions: sanitizedQuestions.length,
        questions: sanitizedQuestions,
        serverTime: now.toISOString(),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already attempted this exam. Multiple attempts are not permitted.',
        error: 'ALREADY_ATTEMPTED',
      });
    }
    next(error);
  }
});

// @route   POST /api/attempts/:attemptId/submit
// @desc    Submit an exam attempt (Auto-calculates score server-side)
// @access  Private (Student)
router.post('/attempts/:attemptId/submit', authenticateJWT, checkStudent, async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { answers = [], isTimeout = false } = req.body;
    const studentId = req.user._id;

    // 1. Fetch Attempt
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt session not found.',
        error: 'ATTEMPT_NOT_FOUND',
      });
    }

    // Ensure attempt belongs to requesting student
    if (attempt.studentId.toString() !== studentId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this attempt session.',
        error: 'UNAUTHORIZED_ATTEMPT',
      });
    }

    // Prevent duplicate submissions
    if (attempt.status === 'submitted' || attempt.status === 'evaluated') {
      return res.status(400).json({
        success: false,
        message: 'This exam has already been submitted.',
        error: 'ALREADY_SUBMITTED',
      });
    }

    // 2. Fetch Exam & Questions
    const exam = await Exam.findById(attempt.examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Associated exam not found.',
        error: 'EXAM_NOT_FOUND',
      });
    }

    const questions = await Question.find({ examId: exam._id });

    // 3. Server-side Duration Validation
    const now = new Date();
    const elapsedMs = now.getTime() - new Date(attempt.startedAt).getTime();
    const allowedDurationMs = (exam.durationMinutes * 60 * 1000) + 45000; // 45s grace period for network latency
    const submissionType = (isTimeout || elapsedMs > allowedDurationMs) ? 'timeout' : 'manual';

    // 4. Server-Side Score Calculation (COMPARE WITH STORED CORRECT ANSWERS)
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const answerMap = {};
    if (Array.isArray(answers)) {
      answers.forEach((ans) => {
        if (ans.questionId) {
          answerMap[ans.questionId.toString()] = ans.selectedOption;
        }
      });
    }

    const evaluatedAnswers = questions.map((q) => {
      const qIdStr = q._id.toString();
      const selected = answerMap[qIdStr] || null;

      let isCorrect = false;
      let marksObtained = 0;

      if (!selected) {
        unansweredCount++;
      } else {
        // Normalize comparison (e.g. "A", "B", "C", "D" or matching option text/index)
        const normalizedSelected = selected.toString().trim().toUpperCase();
        const normalizedCorrect = q.correctAnswer.toString().trim().toUpperCase();

        if (normalizedSelected === normalizedCorrect) {
          isCorrect = true;
          marksObtained = q.marks || 1;
          score += marksObtained;
          correctCount++;
        } else {
          wrongCount++;
        }
      }

      return {
        questionId: q._id,
        questionNumber: q.questionNumber,
        selectedOption: selected,
        isCorrect,
        marksObtained,
      };
    });

    const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 1), 0) || 50;
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

    // 5. Update Attempt Record
    attempt.answers = evaluatedAnswers;
    attempt.submittedAt = now;
    attempt.durationSpentSeconds = Math.max(0, Math.round(elapsedMs / 1000));
    attempt.submissionType = submissionType;
    attempt.score = score;
    attempt.totalMarks = totalMarks;
    attempt.percentage = percentage;
    attempt.correctCount = correctCount;
    attempt.wrongCount = wrongCount;
    attempt.unansweredCount = unansweredCount;
    attempt.status = 'submitted';

    await attempt.save();

    // 6. Return Response (DO NOT SEND SCORE IF RESULT NOT RELEASED)
    return res.status(200).json({
      success: true,
      message: submissionType === 'timeout'
        ? 'Time expired. Your exam has been submitted automatically.'
        : 'Exam submitted successfully.',
      data: {
        attemptId: attempt._id,
        submissionType,
        submittedAt: now,
        resultReleased: exam.resultReleased,
        message: exam.resultReleased
          ? 'Your result is available.'
          : 'Your result will be announced by the administrator.',
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/attempts/:attemptId
// @desc    Get attempt details (Only exposes score if admin OR result is released)
// @access  Private
router.get('/attempts/:attemptId', authenticateJWT, async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const attempt = await Attempt.findById(attemptId).populate('examId', 'title subject examDate startTime resultReleased');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt record not found.',
        error: 'ATTEMPT_NOT_FOUND',
      });
    }

    const isOwner = req.user.role === 'student' && attempt.studentId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this attempt record.',
        error: 'UNAUTHORIZED',
      });
    }

    const exam = attempt.examId;

    // If student and result is not released yet -> HIDE SCORES & ANSWERS
    if (isOwner && !exam.resultReleased) {
      return res.status(200).json({
        success: true,
        data: {
          attemptId: attempt._id,
          exam: {
            id: exam._id,
            title: exam.title,
            subject: exam.subject,
            examDate: exam.examDate,
            startTime: exam.startTime,
            resultReleased: false,
          },
          status: attempt.status,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          submissionType: attempt.submissionType,
          durationSpentSeconds: attempt.durationSpentSeconds,
          message: 'Result has not been released yet. Please check back later.',
        },
      });
    }

    // If Admin OR Result is Released -> Return detailed breakdown
    const questions = await Question.find({ examId: exam._id }).sort({ questionNumber: 1 });
    const questionMap = {};
    questions.forEach((q) => {
      questionMap[q._id.toString()] = q;
    });

    const detailedBreakdown = attempt.answers.map((ans) => {
      const q = questionMap[ans.questionId.toString()];
      return {
        questionNumber: ans.questionNumber || (q ? q.questionNumber : 0),
        questionText: q ? q.questionText : 'Question details',
        options: q ? q.options : [],
        selectedOption: ans.selectedOption,
        correctAnswer: q ? q.correctAnswer : '',
        explanation: q ? q.explanation : '',
        isCorrect: ans.isCorrect,
        marksObtained: ans.marksObtained,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        exam: {
          id: exam._id,
          title: exam.title,
          subject: exam.subject,
          examDate: exam.examDate,
          startTime: exam.startTime,
          resultReleased: exam.resultReleased,
        },
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        submissionType: attempt.submissionType,
        durationSpentSeconds: attempt.durationSpentSeconds,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        unansweredCount: attempt.unansweredCount,
        breakdown: detailedBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
