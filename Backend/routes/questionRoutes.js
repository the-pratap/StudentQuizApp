const express = require('express');
const router = express.Router({ mergeParams: true });
const Question = require('../models/QuestionSchema');
const Exam = require('../models/ExamSchema');
const authenticateJWT = require('../middleware/authenticateJWT');
const checkAdmin = require('../middleware/checkAdmin');

// @route   GET /api/exams/:examId/questions
// @desc    Get questions for an exam (NEVER returns correctAnswer to students!)
// @access  Private
router.get('/exams/:examId/questions', authenticateJWT, async (req, res, next) => {
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

    const questions = await Question.find({ examId }).sort({ questionNumber: 1 });

    // CRITICAL SECURITY: If user is Student, strip correctAnswer & explanation
    if (req.user.role === 'student') {
      const sanitizedQuestions = questions.map((q) => ({
        id: q._id,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        options: q.options,
        marks: q.marks,
      }));

      return res.status(200).json({
        success: true,
        count: sanitizedQuestions.length,
        data: sanitizedQuestions,
      });
    }

    // Admin receives full details
    return res.status(200).json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/exams/:examId/questions
// @desc    Add a question to an exam (Admin only)
// @access  Private (Admin)
router.post('/exams/:examId/questions', authenticateJWT, checkAdmin, async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { questionText, options, correctAnswer, marks = 1, explanation = '', questionNumber } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
        error: 'EXAM_NOT_FOUND',
      });
    }

    if (!questionText || !options || !correctAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Question text, options (at least 2), and correct answer are required.',
        error: 'MISSING_FIELDS',
      });
    }

    // Determine question number if not passed
    let qNum = questionNumber;
    if (!qNum) {
      const count = await Question.countDocuments({ examId });
      qNum = count + 1;
    }

    const question = await Question.create({
      examId,
      questionNumber: qNum,
      questionText: questionText.trim(),
      options: Array.isArray(options) ? options.map((opt) => opt.trim()) : [],
      correctAnswer: correctAnswer.toString().trim(),
      marks: Number(marks) || 1,
      explanation: explanation.trim(),
    });

    // Update totalQuestions on exam if needed
    const currentCount = await Question.countDocuments({ examId });
    if (currentCount > exam.totalQuestions) {
      exam.totalQuestions = currentCount;
      await exam.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Question added successfully',
      data: question,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/exams/:examId/questions/bulk
// @desc    Bulk create/seed questions for an exam (Admin only)
// @access  Private (Admin)
router.post('/exams/:examId/questions/bulk', authenticateJWT, checkAdmin, async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of questions.',
        error: 'INVALID_QUESTIONS_ARRAY',
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
        error: 'EXAM_NOT_FOUND',
      });
    }

    const docsToInsert = questions.map((q, idx) => ({
      examId,
      questionNumber: q.questionNumber || idx + 1,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer.toString().trim(),
      marks: q.marks || 1,
      explanation: q.explanation || '',
    }));

    const inserted = await Question.insertMany(docsToInsert);

    const totalCount = await Question.countDocuments({ examId });
    exam.totalQuestions = totalCount;
    await exam.save();

    return res.status(201).json({
      success: true,
      message: `Successfully added ${inserted.length} questions.`,
      count: inserted.length,
      data: inserted,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/questions/:id
// @desc    Update a question (Admin only)
// @access  Private (Admin)
router.put('/questions/:id', authenticateJWT, checkAdmin, async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
        error: 'QUESTION_NOT_FOUND',
      });
    }

    const { questionText, options, correctAnswer, marks, explanation, questionNumber } = req.body;

    if (questionText) question.questionText = questionText.trim();
    if (options && Array.isArray(options)) question.options = options.map((opt) => opt.trim());
    if (correctAnswer) question.correctAnswer = correctAnswer.toString().trim();
    if (marks !== undefined) question.marks = Number(marks);
    if (explanation !== undefined) question.explanation = explanation.trim();
    if (questionNumber !== undefined) question.questionNumber = Number(questionNumber);

    await question.save();

    return res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      data: question,
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/questions/:id
// @desc    Delete a question (Admin only)
// @access  Private (Admin)
router.delete('/questions/:id', authenticateJWT, checkAdmin, async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
        error: 'QUESTION_NOT_FOUND',
      });
    }

    const examId = question.examId;
    await Question.findByIdAndDelete(req.params.id);

    // Update exam total questions count
    const remainingCount = await Question.countDocuments({ examId });
    await Exam.findByIdAndUpdate(examId, { totalQuestions: remainingCount });

    return res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
