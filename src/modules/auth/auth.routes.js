const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middlewares/validate.middleware');
const authenticate = require('../../middlewares/auth.middleware');
const authController = require('./auth.controller');
const { loginSchema } = require('./auth.validation');

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

module.exports = router;
