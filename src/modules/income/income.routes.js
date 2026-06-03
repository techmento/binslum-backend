const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middlewares/validate.middleware');
const authenticate = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const incomeController = require('./income.controller');
const { createIncomeSchema, updateIncomeSchema, incomeQuerySchema } = require('./income.validation');

// All routes require authentication
router.use(authenticate);

// GET /api/income/types - Get income types (ACCOUNTANT and above)
router.get('/types', authorize(['ADMIN', 'ACCOUNTANT']), asyncHandler(incomeController.getIncomeTypes));

// GET /api/income/summary - Get income summary (MANAGER and above)
router.get(
  '/summary',
  authorize(['ADMIN', 'ACCOUNTANT', 'MANAGER', 'VIEWER']),
  validate(incomeQuerySchema, 'query'),
  asyncHandler(incomeController.getIncomeSummary)
);

// GET /api/income - Get incomes with filtering (MANAGER and above)
router.get(
  '/',
  authorize(['ADMIN', 'ACCOUNTANT', 'MANAGER', 'VIEWER']),
  validate(incomeQuerySchema, 'query'),
  asyncHandler(incomeController.getIncomes)
);

// GET /api/income/:id - Get income by ID (MANAGER and above)
router.get(
  '/:id',
  authorize(['ADMIN', 'ACCOUNTANT', 'MANAGER', 'VIEWER']),
  asyncHandler(incomeController.getIncomeById)
);

// POST /api/income - Create income (ACCOUNTANT and above)
router.post(
  '/',
  authorize(['ADMIN', 'ACCOUNTANT']),
  validate(createIncomeSchema),
  asyncHandler(incomeController.createIncome)
);

// PUT /api/income/:id - Update income (ACCOUNTANT and above)
router.put(
  '/:id',
  authorize(['ADMIN', 'ACCOUNTANT']),
  validate(updateIncomeSchema),
  asyncHandler(incomeController.updateIncome)
);

// DELETE /api/income/:id - Delete income (ADMIN only)
router.delete(
  '/:id',
  authorize(['ADMIN']),
  asyncHandler(incomeController.deleteIncome)
);

module.exports = router;
