const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Exam title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    examDate: {
      type: String, // e.g. "2026-08-25"
      required: [true, 'Exam date is required'],
    },
    startTime: {
      type: String, // e.g. "10:00" (24-hour) or "10:00 AM"
      required: [true, 'Start time is required'],
    },
    startDateTime: {
      type: Date,
      required: [true, 'Calculated start datetime is required'],
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      default: 10,
      min: [1, 'Duration must be at least 1 minute'],
    },
    totalQuestions: {
      type: Number,
      required: [true, 'Total questions is required'],
      default: 50,
      min: [1, 'Must have at least 1 question'],
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'ACTIVE', 'COMPLETED'],
      default: 'UPCOMING',
    },
    resultReleased: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for query performance
ExamSchema.index({ examDate: 1 });
ExamSchema.index({ startDateTime: 1 });
ExamSchema.index({ createdBy: 1 });
ExamSchema.index({ status: 1 });

module.exports = mongoose.model('Exam', ExamSchema);
