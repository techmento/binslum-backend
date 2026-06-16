const { sendSuccess, sendError } = require('../../utils/apiResponse');
const { HTTP_STATUS } = require('../../config/constants');
const prisma = require('../../config/database');
const bcryptjs = require('bcryptjs');

// Get all users (SUPER_ADMIN only)
const getAllUsers = async (req, res, next) => {
  const { limit = 100, offset = 0, role, isActive } = req.query;

  const where = {};
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const users = await prisma.user.findMany({
    where,
    take: parseInt(limit),
    skip: parseInt(offset),
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.user.count({ where });

  sendSuccess(res, { users, total, limit: parseInt(limit), offset: parseInt(offset) }, 'Users retrieved', HTTP_STATUS.OK);
};

// Get user by ID (SUPER_ADMIN only)
const getUserById = async (req, res, next) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  sendSuccess(res, user, 'User retrieved', HTTP_STATUS.OK);
};

// Update user role (SUPER_ADMIN only)
const updateUserRole = async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'VIEWER'];
  if (!validRoles.includes(role)) {
    const error = new Error(`Invalid role. Valid roles: ${validRoles.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  sendSuccess(res, updated, 'User role updated', HTTP_STATUS.OK);
};

// Activate user (SUPER_ADMIN only)
const activateUser = async (req, res, next) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  sendSuccess(res, updated, 'User activated', HTTP_STATUS.OK);
};

// Deactivate user (SUPER_ADMIN only)
const deactivateUser = async (req, res, next) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  sendSuccess(res, updated, 'User deactivated', HTTP_STATUS.OK);
};

// Reset user password (SUPER_ADMIN only)
const resetUserPassword = async (req, res, next) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    const error = new Error('Password must be at least 8 characters');
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const hashedPassword = await bcryptjs.hash(newPassword, 10);

  await prisma.user.update({
    where: { id },
    data: { passwordHash: hashedPassword },
  });

  sendSuccess(res, { message: 'Password reset successfully' }, 'User password reset', HTTP_STATUS.OK);
};

// Delete user (SUPER_ADMIN only)
const deleteUser = async (req, res, next) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.user.delete({ where: { id } });

  sendSuccess(res, { message: 'User deleted successfully' }, 'User deleted', HTTP_STATUS.OK);
};

// Get all audit logs (SUPER_ADMIN only)
const getAuditLogs = async (req, res, next) => {
  const { limit = 100, offset = 0, userId, action } = req.query;

  const where = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;

  const logs = await prisma.auditLog.findMany({
    where,
    take: parseInt(limit),
    skip: parseInt(offset),
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.auditLog.count({ where });

  sendSuccess(res, { logs, total, limit: parseInt(limit), offset: parseInt(offset) }, 'Audit logs retrieved', HTTP_STATUS.OK);
};

// Get audit log stats (SUPER_ADMIN only)
const getAuditStats = async (req, res, next) => {
  const actionCounts = await prisma.auditLog.groupBy({
    by: ['action'],
    _count: true,
    orderBy: { _count: { action: 'desc' } },
  });

  const userCounts = await prisma.auditLog.groupBy({
    by: ['userId'],
    _count: true,
    orderBy: { _count: { userId: 'desc' } },
    take: 10,
  });

  sendSuccess(res, { actionCounts, topUsers: userCounts }, 'Audit stats retrieved', HTTP_STATUS.OK);
};

// Get system overview (SUPER_ADMIN only)
const getSystemOverview = async (req, res, next) => {
  const totalUsers = await prisma.user.count();
  const activeUsers = await prisma.user.count({ where: { isActive: true } });
  const totalIncomes = await prisma.incomeRecord.count();
  const totalExpenses = await prisma.expenseRecord.count();
  const totalShips = await prisma.ship.count();
  const totalEmployees = await prisma.employee.count();

  const roleDistribution = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  });

  sendSuccess(
    res,
    {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      totalIncomes,
      totalExpenses,
      totalShips,
      totalEmployees,
      roleDistribution,
    },
    'System overview retrieved',
    HTTP_STATUS.OK
  );
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  activateUser,
  deactivateUser,
  resetUserPassword,
  deleteUser,
  getAuditLogs,
  getAuditStats,
  getSystemOverview,
};
