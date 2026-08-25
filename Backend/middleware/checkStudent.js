const checkStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
      error: 'AUTH_REQUIRED',
    });
  }

  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden. Student account required.',
      error: 'STUDENT_ONLY',
    });
  }

  next();
};

module.exports = checkStudent;
