const Joi = require('joi');
const { EXPENSE_CATEGORIES, PAYMENT_METHODS } = require('../../config/constants');

const createExpenseSchema = Joi.object({
  shipId: Joi.string().uuid().required().messages({
    'string.uuid': 'Ship ID must be a valid UUID',
    'any.required': 'Ship ID is required',
  }),
  category: Joi.string()
    .valid(...Object.values(EXPENSE_CATEGORIES))
    .required()
    .messages({
      'any.only': `Category must be one of: ${Object.values(EXPENSE_CATEGORIES).join(', ')}`,
      'any.required': 'Category is required',
    }),
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Amount must be positive',
    'number.base': 'Amount must be a number',
    'any.required': 'Amount is required',
  }),
  date: Joi.date().iso().required().messages({
    'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
    'any.required': 'Date is required',
  }),
  paymentMethod: Joi.string()
    .valid(...Object.values(PAYMENT_METHODS))
    .required()
    .messages({
      'any.only': `Payment method must be one of: ${Object.values(PAYMENT_METHODS).join(', ')}`,
      'any.required': 'Payment method is required',
    }),
  description: Joi.string().max(1000).allow('').optional(),
  employeeId: Joi.when('category', {
    is: EXPENSE_CATEGORIES.SALARY,
    then: Joi.string().uuid().required().messages({
      'string.uuid': 'Employee ID must be a valid UUID',
      'any.required': 'Employee ID is required for salary expenses',
    }),
    otherwise: Joi.string().uuid().optional(),
  }),
  loanPaymentId: Joi.when('category', {
    is: EXPENSE_CATEGORIES.LOAN_REPAYMENT,
    then: Joi.string().uuid().required().messages({
      'string.uuid': 'Loan payment ID must be a valid UUID',
      'any.required': 'Loan payment ID is required for loan repayment expenses',
    }),
    otherwise: Joi.string().uuid().optional(),
  }),
});

const updateExpenseSchema = Joi.object({
  category: Joi.string()
    .valid(...Object.values(EXPENSE_CATEGORIES))
    .optional()
    .messages({
      'any.only': `Category must be one of: ${Object.values(EXPENSE_CATEGORIES).join(', ')}`,
    }),
  amount: Joi.number().positive().precision(2).optional().messages({
    'number.positive': 'Amount must be positive',
    'number.base': 'Amount must be a number',
  }),
  date: Joi.date().iso().optional().messages({
    'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
  }),
  paymentMethod: Joi.string()
    .valid(...Object.values(PAYMENT_METHODS))
    .optional()
    .messages({
      'any.only': `Payment method must be one of: ${Object.values(PAYMENT_METHODS).join(', ')}`,
    }),
  description: Joi.string().max(1000).allow('').optional(),
  employeeId: Joi.when('category', {
    is: EXPENSE_CATEGORIES.SALARY,
    then: Joi.string().uuid().required().messages({
      'string.uuid': 'Employee ID must be a valid UUID',
      'any.required': 'Employee ID is required for salary expenses',
    }),
    otherwise: Joi.string().uuid().optional(),
  }),
  loanPaymentId: Joi.when('category', {
    is: EXPENSE_CATEGORIES.LOAN_REPAYMENT,
    then: Joi.string().uuid().required().messages({
      'string.uuid': 'Loan payment ID must be a valid UUID',
      'any.required': 'Loan payment ID is required for loan repayment expenses',
    }),
    otherwise: Joi.string().uuid().optional(),
  }),
});

const expenseQuerySchema = Joi.object({
  shipId: Joi.string().uuid().optional().messages({
    'string.uuid': 'Ship ID must be a valid UUID',
  }),
  category: Joi.string()
    .valid(...Object.values(EXPENSE_CATEGORIES))
    .optional()
    .messages({
      'any.only': `Category must be one of: ${Object.values(EXPENSE_CATEGORIES).join(', ')}`,
    }),
  startDate: Joi.date().iso().optional().messages({
    'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
  }),
  endDate: Joi.date().iso().optional().messages({
    'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
  }),
  paymentMethod: Joi.string()
    .valid(...Object.values(PAYMENT_METHODS))
    .optional()
    .messages({
      'any.only': `Payment method must be one of: ${Object.values(PAYMENT_METHODS).join(', ')}`,
    }),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
});

module.exports = {
  createExpenseSchema,
  updateExpenseSchema,
  expenseQuerySchema,
};