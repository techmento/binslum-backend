const Joi = require('joi');

const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12];
const PAYMENT_METHODS = ['CASH','BANK_TRANSFER','CHEQUE'];
const DEDUCTION_REASONS = ['LOAN','SALARY_ADVANCE','TAX_ADJUSTMENT','ABSENCE','LATE_ATTENDANCE','PROPERTY_DAMAGE','OTHER'];

const createSalaryRecordSchema = Joi.object({
  employeeId:  Joi.string().uuid().required().messages({ 'any.required': 'Employee is required' }),
  salaryYear:  Joi.number().integer().min(2000).max(2100).required().messages({ 'any.required': 'Salary year is required' }),
  salaryMonth: Joi.number().integer().valid(...MONTHS).required().messages({ 'any.required': 'Salary month is required', 'any.only': 'Month must be 1–12' }),
  notes:       Joi.string().max(1000).allow('').optional(),
});

const addPaymentSchema = Joi.object({
  amount:        Joi.number().positive().precision(2).required().messages({ 'any.required': 'Amount is required', 'number.positive': 'Amount must be positive' }),
  paymentDate:   Joi.date().iso().required().messages({ 'any.required': 'Payment date is required' }),
  paymentMethod: Joi.string().valid(...PAYMENT_METHODS).required().messages({ 'any.required': 'Payment method is required' }),
  notes:         Joi.string().max(500).allow('').optional(),
});

const addBonusSchema = Joi.object({
  amount:        Joi.number().positive().precision(2).required().messages({ 'any.required': 'Bonus amount is required' }),
  reason:        Joi.string().max(300).required().messages({ 'any.required': 'Bonus reason is required' }),
  bonusDate:     Joi.date().iso().required().messages({ 'any.required': 'Bonus date is required' }),
  paymentMethod: Joi.string().valid(...PAYMENT_METHODS).required(),
});

const addDeductionSchema = Joi.object({
  amount:        Joi.number().positive().precision(2).required().messages({ 'any.required': 'Deduction amount is required' }),
  reason:        Joi.string().valid(...DEDUCTION_REASONS).required().messages({ 'any.required': 'Deduction reason is required' }),
  deductionDate: Joi.date().iso().required().messages({ 'any.required': 'Deduction date is required' }),
  notes:         Joi.string().max(500).allow('').optional(),
});

const salaryQuerySchema = Joi.object({
  employeeId:  Joi.string().uuid().optional(),
  salaryYear:  Joi.number().integer().min(2000).max(2100).optional(),
  salaryMonth: Joi.number().integer().valid(...MONTHS).optional(),
  status:      Joi.string().valid('UNPAID','PARTIAL','PAID').optional(),
  search:      Joi.string().max(100).optional(),
  page:        Joi.number().integer().min(1).optional().default(1),
  limit:       Joi.number().integer().min(1).max(200).optional().default(20),
});

module.exports = {
  createSalaryRecordSchema, addPaymentSchema, addBonusSchema,
  addDeductionSchema, salaryQuerySchema,
};
