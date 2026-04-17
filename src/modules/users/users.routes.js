const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middlewares/validate.middleware');
const authenticate = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const usersController = require('./users.controller');
const { createUserSchema, updateUserSchema } = require('./users.validation');

// All routes require authentication
router.use(authenticate);

// GET /api/users - Get all users (ADMIN only)
router.get(
  '/',
  authorize(['ADMIN']),
  asyncHandler(usersController.getAllUsers)
);

// GET /api/users/:id - Get user by ID (ADMIN only)
router.get(
  '/:id',
  authorize(['ADMIN']),
  asyncHandler(usersController.getUserById)
);

// POST /api/users - Create user (ADMIN only)
router.post(
  '/',
  authorize(['ADMIN']),
  validate(createUserSchema),
  asyncHandler(usersController.createUser)
);

// PUT /api/users/:id - Update user (ADMIN only)
router.put(
  '/:id',
  authorize(['ADMIN']),
  validate(updateUserSchema),
  asyncHandler(usersController.updateUser)
);

// DELETE /api/users/:id - Soft delete user (ADMIN only)
router.delete(
  '/:id',
  authorize(['ADMIN']),
  asyncHandler(usersController.softDeleteUser)
);

module.exports = router;