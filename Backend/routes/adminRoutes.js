const express = require('express');
const router = express.Router();
const User = require('../models/UserSchema');
const Exam = require('../models/ExamSchema');
const Attempt = require('../models/AttemptSchema');
const Question = require('../models/QuestionSchema');
const OTP = require('../models/OTPSchema');
const authenticateJWT = require('../middleware/authenticateJWT');
const checkAdmin = require('../middleware/checkAdmin');

// Apply admin guard to all routes in this file
router.use(authenticateJWT, checkAdmin);

// @route   GET /api/admin/dashboard
// @desc    Get system statistics and metrics for Admin Dashboard
// @access  Private (Admin)
router.get('/dashboard', async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const blockedStudents = await User.countDocuments({ role: 'student', status: 'blocked' });
    const totalExams = await Exam.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalAttempts = await Attempt.countDocuments();

    const now = new Date();
    const allExams = await Exam.find();

    let activeExamsCount = 0;
    let completedExamsCount = 0;
    let upcomingExamsCount = 0;
    let resultsPendingCount = 0;

    allExams.forEach((exam) => {
      const start = new Date(exam.startDateTime);
      const end = new Date(start.getTime() + (exam.durationMinutes || 10) * 60 * 1000);

      if (now < start) {
        upcomingExamsCount++;
      } else if (now >= start && now <= end) {
        activeExamsCount++;
      } else {
        completedExamsCount++;
        if (!exam.resultReleased) {
          resultsPendingCount++;
        }
      }
    });

    const recentAttempts = await Attempt.find()
      .populate('studentId', 'name email')
      .populate('examId', 'title subject')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentStudents = await User.find({ role: 'student' })
      .select('name email status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalStudents,
          blockedStudents,
          totalExams,
          upcomingExams: upcomingExamsCount,
          activeExams: activeExamsCount,
          completedExams: completedExamsCount,
          totalAttempts,
          resultsPending: resultsPendingCount,
          totalQuestions,
        },
        recentAttempts: recentAttempts.map((att) => ({
          id: att._id,
          studentName: att.studentId ? att.studentId.name : 'Unknown',
          studentEmail: att.studentId ? att.studentId.email : '',
          examTitle: att.examId ? att.examId.title : 'Exam',
          subject: att.examId ? att.examId.subject : '',
          score: att.score,
          totalMarks: att.totalMarks,
          percentage: att.percentage,
          status: att.status,
          submittedAt: att.submittedAt,
        })),
        recentStudents,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/students
// @desc    Get all registered students with attempt statistics
// @access  Private (Admin)
router.get('/students', async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' }).sort({ createdAt: -1 });

    const studentIds = students.map((s) => s._id);
    const attempts = await Attempt.find({ studentId: { $in: studentIds } });

    const attemptsCountMap = {};
    attempts.forEach((att) => {
      const sId = att.studentId.toString();
      attemptsCountMap[sId] = (attemptsCountMap[sId] || 0) + 1;
    });

    const studentList = students.map((s) => ({
      id: s._id,
      name: s.name,
      email: s.email,
      status: s.status,
      registeredDate: s.createdAt,
      totalAttempts: attemptsCountMap[s._id.toString()] || 0,
    }));

    return res.status(200).json({
      success: true,
      count: studentList.length,
      data: studentList,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/admin/students/:id/block
// @desc    Block a student from accessing the app
// @access  Private (Admin)
router.patch('/students/:id/block', async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student account not found.',
        error: 'STUDENT_NOT_FOUND',
      });
    }

    student.status = 'blocked';
    await student.save();

    return res.status(200).json({
      success: true,
      message: `Student ${student.name} has been blocked.`,
      data: {
        id: student._id,
        name: student.name,
        email: student.email,
        status: student.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/admin/students/:id/unblock
// @desc    Unblock a student
// @access  Private (Admin)
router.patch('/students/:id/unblock', async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student account not found.',
        error: 'STUDENT_NOT_FOUND',
      });
    }

    student.status = 'active';
    await student.save();

    return res.status(200).json({
      success: true,
      message: `Student ${student.name} has been unblocked.`,
      data: {
        id: student._id,
        name: student.name,
        email: student.email,
        status: student.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/students/:id
// @desc    Delete a student and their attempts
// @access  Private (Admin)
router.delete('/students/:id', async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student account not found.',
        error: 'STUDENT_NOT_FOUND',
      });
    }

    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      Attempt.deleteMany({ studentId: req.params.id }),
    ]);

    return res.status(200).json({
      success: true,
      message: `Student ${student.name} and associated attempts deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/exams/:id/attempts
// @desc    Get all student attempts & submissions for an exam
// @access  Private (Admin)
router.get('/exams/:id/attempts', async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.',
        error: 'EXAM_NOT_FOUND',
      });
    }

    const attempts = await Attempt.find({ examId: req.params.id })
      .populate('studentId', 'name email status')
      .sort({ score: -1, submittedAt: 1 });

    const formattedAttempts = attempts.map((att, idx) => ({
      id: att._id,
      rank: idx + 1,
      studentId: att.studentId ? att.studentId._id : 'N/A',
      studentName: att.studentId ? att.studentId.name : 'Unknown Student',
      studentEmail: att.studentId ? att.studentId.email : '',
      studentStatus: att.studentId ? att.studentId.status : 'active',
      startedAt: att.startedAt,
      submittedAt: att.submittedAt,
      durationSpentSeconds: att.durationSpentSeconds,
      submissionType: att.submissionType,
      status: att.status,
      score: att.score,
      totalMarks: att.totalMarks,
      percentage: att.percentage,
      correctCount: att.correctCount,
      wrongCount: att.wrongCount,
      unansweredCount: att.unansweredCount,
    }));

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
      totalSubmissions: formattedAttempts.length,
      data: formattedAttempts,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/exams/:id/release-result
// @desc    Release results for an exam (Unlocks scores & leaderboard for students)
// @access  Private (Admin)
router.post('/exams/:id/release-result', async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.',
        error: 'EXAM_NOT_FOUND',
      });
    }

    exam.resultReleased = true;
    await exam.save();

    // Update all attempts status to evaluated
    await Attempt.updateMany(
      { examId: exam._id, status: 'submitted' },
      { status: 'evaluated' }
    );

    const submissionCount = await Attempt.countDocuments({ examId: exam._id });

    return res.status(200).json({
      success: true,
      message: `Results for '${exam.title}' have been released successfully! Students can now view scores and leaderboard.`,
      data: {
        examId: exam._id,
        title: exam.title,
        resultReleased: true,
        totalSubmissionsEvaluated: submissionCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
