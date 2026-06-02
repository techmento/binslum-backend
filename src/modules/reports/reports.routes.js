const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middlewares/validate.middleware');
const authenticate = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const reportsController = require('./reports.controller');
const {
  reportQuerySchema,
  expenseReportQuerySchema,
  incomeReportQuerySchema,
  shipPerformanceQuerySchema,
} = require('./reports.validation');

// All routes require authentication
router.use(authenticate);

// GET /api/reports/profit-loss - Profit & Loss report (MANAGER and above)
router.get(
  '/profit-loss',
  authorize(['ADMIN', 'ACCOUNTANT', 'MANAGER', 'VIEWER']),
  validate(reportQuerySchema, 'query'),
  asyncHandler(reportsController.getProfitLossReport)
);

// GET /api/reports/ship-performance - Ship performance report (MANAGER and above)
router.get(
  '/ship-performance',
  authorize(['ADMIN', 'ACCOUNTANT', 'MANAGER', 'VIEWER']),
  validate(shipPerformanceQuerySchema, 'query'),
  asyncHandler(reportsController.getShipPerformanceReport)
);

// GET /api/reports/expense-analysis - Expense analysis report (ACCOUNTANT and above)
router.get(
  '/expense-analysis',
  authorize(['ADMIN', 'ACCOUNTANT']),
  validate(expenseReportQuerySchema, 'query'),
  asyncHandler(reportsController.getExpenseAnalysisReport)
);

// GET /api/reports/income-analysis - Income analysis report (ACCOUNTANT and above)
router.get(
  '/income-analysis',
  authorize(['ADMIN', 'ACCOUNTANT']),
  validate(incomeReportQuerySchema, 'query'),
  asyncHandler(reportsController.getIncomeAnalysisReport)
);

// GET /api/reports/loans - Loan report (ACCOUNTANT and above)
router.get(
  '/loans',
  authorize(['ADMIN', 'ACCOUNTANT']),
  asyncHandler(reportsController.getLoanReport)
);

// GET /api/reports/financial-summary - Comprehensive financial summary
router.get(
  '/financial-summary',
  authorize(['ADMIN', 'ACCOUNTANT', 'MANAGER', 'VIEWER']),
  asyncHandler(reportsController.getFinancialSummary)
);

module.exports = router;
