const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID is required'],
    },
    questionNumber: {
      type: Number,
      required: [true, 'Question number is required'],
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      type: [String],
      required: [true, 'Options are required'],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length >= 2;
        },
        message: 'A question must have at least 2 options (standard: 4 options)',
      },
    },
    correctAnswer: {
      type: String, // "A", "B", "C", "D" or option text / index
      required: [true, 'Correct answer is required'],
      trim: true,
    },
    marks: {
      type: Number,
      default: 1,
      min: [1, 'Marks must be at least 1'],
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

QuestionSchema.index({ examId: 1, questionNumber: 1 });

module.exports = mongoose.model('Question', QuestionSchema);
