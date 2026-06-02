const express = require('express');
const router  = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate     = require('../../middlewares/validate.middleware');
const authenticate = require('../../middlewares/auth.middleware');
const authorize    = require('../../middlewares/role.middleware');
const { upload }   = require('../../middlewares/upload.middleware');
const ctrl = require('./salary.controller');
const { createSalaryRecordSchema, addPaymentSchema, addBonusSchema, addDeductionSchema, salaryQuerySchema } = require('./salary.validation');

router.use(authenticate);

// Analytics & lookups (no body validation needed)
router.get('/years',                    authorize(['ADMIN','ACCOUNTANT','MANAGER','VIEWER']), asyncHandler(ctrl.getAvailableYears));
router.get('/analytics/:year/:month',   authorize(['ADMIN','ACCOUNTANT','MANAGER','VIEWER']), asyncHandler(ctrl.getMonthlyAnalytics));
router.get('/employee/:employeeId',     authorize(['ADMIN','ACCOUNTANT','MANAGER','VIEWER']), asyncHandler(ctrl.getEmployeeHistory));

// CRUD for salary records
router.get('/',    authorize(['ADMIN','ACCOUNTANT','MANAGER','VIEWER']), validate(salaryQuerySchema, 'query'), asyncHandler(ctrl.getRecords));
router.post('/',   authorize(['ADMIN','ACCOUNTANT']), validate(createSalaryRecordSchema), asyncHandler(ctrl.createRecord));
router.get('/:id', authorize(['ADMIN','ACCOUNTANT','MANAGER','VIEWER']), asyncHandler(ctrl.getRecord));
router.delete('/:id', authorize(['ADMIN']), asyncHandler(ctrl.deleteRecord));

// Payments
router.post('/:id/payments', authorize(['ADMIN','ACCOUNTANT']), upload.single('receipt'), validate(addPaymentSchema), asyncHandler(ctrl.addPayment));
router.delete('/:id/payments/:paymentId', authorize(['ADMIN']), asyncHandler(ctrl.deletePayment));

// Bonuses
router.post('/:id/bonuses', authorize(['ADMIN','ACCOUNTANT']), upload.single('receipt'), validate(addBonusSchema), asyncHandler(ctrl.addBonus));

// Deductions
router.post('/:id/deductions', authorize(['ADMIN','ACCOUNTANT']), validate(addDeductionSchema), asyncHandler(ctrl.addDeduction));

module.exports = router;

