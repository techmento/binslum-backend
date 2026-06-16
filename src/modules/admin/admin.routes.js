const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const authenticate = require('../../middlewares/auth.middleware');
const { requireSuperAdmin } = require('../../middlewares/authorize.middleware');
const adminController = require('./admin.controller');

// All admin routes require authentication and SUPER_ADMIN role
router.use(authenticate, requireSuperAdmin);

// User Management
router.get('/users', asyncHandler(adminController.getAllUsers));
router.get('/users/:id', asyncHandler(adminController.getUserById));
router.patch('/users/:id/role', asyncHandler(adminController.updateUserRole));
router.patch('/users/:id/activate', asyncHandler(adminController.activateUser));
router.patch('/users/:id/deactivate', asyncHandler(adminController.deactivateUser));
router.patch('/users/:id/reset-password', asyncHandler(adminController.resetUserPassword));
router.delete('/users/:id', asyncHandler(adminController.deleteUser));

// Audit Logs
router.get('/audit-logs', asyncHandler(adminController.getAuditLogs));
router.get('/audit-stats', asyncHandler(adminController.getAuditStats));

// System Overview
router.get('/system-overview', asyncHandler(adminController.getSystemOverview));

module.exports = router;
