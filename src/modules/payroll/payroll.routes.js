const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middlewares/validate.middleware');
const authenticate = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const payrollController = require('./payroll.controller');
const {
  createPayrollSchema,
  updatePayrollSchema,
  payrollQuerySchema,
  processPayrollSchema,
} = require('./payroll.validation');

// All routes require authentication
router.use(authenticate);

// GET /api/payroll - Get payrolls with filtering (ACCOUNTANT and above)
router.get(
  '/',
  authorize(['ADMIN', 'ACCOUNTANT']),
  validate(payrollQuerySchema, 'query'),
  asyncHandler(payrollController.getPayrolls)
);

// GET /api/payroll/:id - Get payroll by ID (ACCOUNTANT and above)
router.get(
  '/:id',
  authorize(['ADMIN', 'ACCOUNTANT']),
  asyncHandler(payrollController.getPayrollById)
);

// POST /api/payroll - Create payroll (ACCOUNTANT and above)
router.post(
  '/',
  authorize(['ADMIN', 'ACCOUNTANT']),
  validate(createPayrollSchema),
  asyncHandler(payrollController.createPayroll)
);

// PUT /api/payroll/:id - Update payroll (ACCOUNTANT and above)
router.put(
  '/:id',
  authorize(['ADMIN', 'ACCOUNTANT']),
  validate(updatePayrollSchema),
  asyncHandler(payrollController.updatePayroll)
);

// POST /api/payroll/:id/process - Process payroll (ACCOUNTANT and above)
router.post(
  '/:id/process',
  authorize(['ADMIN', 'ACCOUNTANT']),
  validate(processPayrollSchema),
  asyncHandler(payrollController.processPayroll)
);

// DELETE /api/payroll/:id - Delete payroll (ADMIN only)
router.delete(
  '/:id',
  authorize(['ADMIN']),
  asyncHandler(payrollController.deletePayroll)
);

module.exports = router;