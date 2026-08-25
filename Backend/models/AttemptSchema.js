const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    questionNumber: {
      type: Number,
    },
    selectedOption: {
      type: String, // "A", "B", "C", "D" or empty/null if unattempted
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    marksObtained: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const AttemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID is required'],
    },
    answers: [AnswerSchema],
    startedAt: {
      type: Date,
      required: [true, 'Start timestamp is required'],
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    durationSpentSeconds: {
      type: Number,
      default: 0,
    },
    submissionType: {
      type: String,
      enum: ['manual', 'timeout'],
      default: 'manual',
    },
    score: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 50,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    wrongCount: {
      type: Number,
      default: 0,
    },
    unansweredCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['started', 'submitted', 'evaluated'],
      default: 'started',
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: One attempt per student per exam
AttemptSchema.index({ studentId: 1, examId: 1 }, { unique: true });
AttemptSchema.index({ examId: 1, score: -1, durationSpentSeconds: 1 });

module.exports = mongoose.model('Attempt', AttemptSchema);
