const { HTTP_STATUS } = require('../config/constants');

const authorize = (...allowedRoles) => {
  const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;

  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
    }

    next();
  };
};

module.exports = authorize;
