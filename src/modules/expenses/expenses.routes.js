const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middlewares/validate.middleware');
const authenticate = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const { upload } = require('../../middlewares/upload.middleware');
const expensesController = require('./expenses.controller');
const { createExpenseSchema, updateExpenseSchema, expenseQuerySchema } = require('./expenses.validation');

// All routes require authentication
router.use(authenticate);

// GET /api/expenses/categories - Get expense categories (no specific role required)
router.get('/categories', asyncHandler(expensesController.getExpenseCategories));

// GET /api/expenses - Get expenses with filtering (MANAGER and above)
router.get(
  '/',
  authorize(['ADMIN', 'ACCOUNTANT', 'MANAGER']),
  validate(expenseQuerySchema, 'query'),
  asyncHandler(expensesController.getExpenses)
);

// GET /api/expenses/:id - Get expense by ID (MANAGER and above)
router.get(
  '/:id',
  authorize(['ADMIN', 'ACCOUNTANT', 'MANAGER']),
  asyncHandler(expensesController.getExpenseById)
);

// POST /api/expenses - Create expense (ACCOUNTANT and above)
router.post(
  '/',
  authorize(['ADMIN', 'ACCOUNTANT']),
  upload.single('receipt'),
  validate(createExpenseSchema),
  asyncHandler(expensesController.createExpense)
);

// PUT /api/expenses/:id - Update expense (ACCOUNTANT and above)
router.put(
  '/:id',
  authorize(['ADMIN', 'ACCOUNTANT']),
  upload.single('receipt'),
  validate(updateExpenseSchema),
  asyncHandler(expensesController.updateExpense)
);

// DELETE /api/expenses/:id - Delete expense (ADMIN only)
router.delete(
  '/:id',
  authorize(['ADMIN']),
  asyncHandler(expensesController.deleteExpense)
);

module.exports = router;