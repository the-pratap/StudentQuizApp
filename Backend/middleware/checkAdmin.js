const checkAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
      error: 'AUTH_REQUIRED',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden. Administrator privileges required.',
      error: 'ADMIN_ONLY',
    });
  }

  next();
};

module.exports = checkAdmin;
