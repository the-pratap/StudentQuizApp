const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const OTPSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID is required'],
    },
    otpHash: {
      type: String,
      required: [true, 'OTP Hash is required'],
    },
    rawOtp: {
      type: String, // Securely accessible to Admin only to display in the dashboard
      required: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Method to verify candidate OTP against stored hash
OTPSchema.methods.verifyOTP = async function (enteredOtp) {
  return await bcrypt.compare(enteredOtp.toString(), this.otpHash);
};

// Index for active OTP lookups
OTPSchema.index({ examId: 1, isActive: 1 });

module.exports = mongoose.model('OTP', OTPSchema);
