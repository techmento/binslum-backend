const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middlewares/validate.middleware');
const authenticate = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const loansController = require('./loans.controller');
const {
  createLoanSchema,
  updateLoanSchema,
  createLoanPaymentSchema,
  loanQuerySchema,
  loanPaymentQuerySchema,
} = require('./loans.validation');

// All routes require authentication
router.use(authenticate);

// GET /api/loans/summary - Get loan summary (ACCOUNTANT and above)
router.get('/summary', authorize(['ADMIN', 'ACCOUNTANT']), asyncHandler(loansController.getLoanSummary));

// GET /api/loans - Get loans with filtering (ACCOUNTANT and above)
router.get(
  '/',
  authorize(['ADMIN', 'ACCOUNTANT']),
  validate(loanQuerySchema, 'query'),
  asyncHandler(loansController.getLoans)
);

// GET /api/loans/:id - Get loan by ID (ACCOUNTANT and above)
router.get(
  '/:id',
  authorize(['ADMIN', 'ACCOUNTANT']),
  asyncHandler(loansController.getLoanById)
);

// POST /api/loans - Create loan (ACCOUNTANT and above)
router.post(
  '/',
  authorize(['ADMIN', 'ACCOUNTANT']),
  validate(createLoanSchema),
  asyncHandler(loansController.createLoan)
);

// PUT /api/loans/:id - Update loan (ACCOUNTANT and above)
router.put(
  '/:id',
  authorize(['ADMIN', 'ACCOUNTANT']),
  validate(updateLoanSchema),
  asyncHandler(loansController.updateLoan)
);

// DELETE /api/loans/:id - Delete loan (ADMIN only)
router.delete(
  '/:id',
  authorize(['ADMIN']),
  asyncHandler(loansController.deleteLoan)
);

// POST /api/loans/:loanId/payments - Create loan payment (ACCOUNTANT and above)
router.post(
  '/:loanId/payments',
  authorize(['ADMIN', 'ACCOUNTANT']),
  validate(createLoanPaymentSchema),
  asyncHandler(loansController.createLoanPayment)
);

// GET /api/loans/:loanId/payments - Get loan payments (ACCOUNTANT and above)
router.get(
  '/:loanId/payments',
  authorize(['ADMIN', 'ACCOUNTANT']),
  validate(loanPaymentQuerySchema, 'query'),
  asyncHandler(loansController.getLoanPayments)
);

module.exports = router;
