const { HTTP_STATUS } = require('../config/constants');

// Role hierarchy: SUPER_ADMIN > ADMIN > ACCOUNTANT > MANAGER > VIEWER
const roleHierarchy = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  ACCOUNTANT: 3,
  MANAGER: 2,
  VIEWER: 1,
};

// Middleware to check if user has required role(s)
const authorize = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const userRole = req.user.role;
    const isAuthorized = requiredRoles.includes(userRole);

    if (!isAuthorized) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      });
    }

    next();
  };
};

// Middleware to check if user has at least a certain role level
const authorizeByLevel = (minRoleLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const userRoleLevel = roleHierarchy[req.user.role] || 0;

    if (userRoleLevel < minRoleLevel) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Insufficient role level for this operation',
      });
    }

    next();
  };
};

// Convenience middleware for SUPER_ADMIN only
const requireSuperAdmin = (req, res, next) => {
  return authorize(['SUPER_ADMIN'])(req, res, next);
};

// Convenience middleware for SUPER_ADMIN and ADMIN
const requireAdminOrSuper = (req, res, next) => {
  return authorize(['SUPER_ADMIN', 'ADMIN'])(req, res, next);
};

module.exports = {
  authorize,
  authorizeByLevel,
  requireSuperAdmin,
  requireAdminOrSuper,
  roleHierarchy,
};
