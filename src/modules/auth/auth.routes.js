const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middlewares/validate.middleware');
const authenticate = require('../../middlewares/auth.middleware');
const authController = require('./auth.controller');
const { loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('./auth.validation');

// POST /api/auth/login - Authenticate user (no auth required)
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(authController.login)
);

// GET /api/auth/me - Get current user profile (auth required)
router.get(
  '/me',
  authenticate,
  asyncHandler(authController.getCurrentUser)
);

// POST /api/auth/forgot-password - Request password reset email (no auth required)
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword)
);

// POST /api/auth/reset-password - Reset password with token (no auth required)
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword)
);

module.exports = router;
