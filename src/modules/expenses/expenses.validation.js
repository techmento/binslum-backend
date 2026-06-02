const Joi = require('joi');
const { PAYMENT_METHODS, EXPENSE_CATEGORIES } = require('../../config/constants');

const createExpenseSchema = Joi.object({
  category: Joi.string().max(100).required().messages({
    'any.required': 'Category is required',
    'string.max': 'Category name must not exceed 100 characters',
  }),

  shipId: Joi.when('category', {
    is: Joi.valid(EXPENSE_CATEGORIES.LOAN_REPAYMENT, EXPENSE_CATEGORIES.SALARY),
    then: Joi.string().uuid().optional().allow('', null),
    otherwise: Joi.string().uuid().required().messages({
      'string.uuid': 'Ship ID must be a valid UUID',
      'any.required': 'Ship ID is required',
    }),
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
    otherwise: Joi.string().uuid().optional().allow('', null),
  }),

  loanId: Joi.when('category', {
    is: EXPENSE_CATEGORIES.LOAN_REPAYMENT,
    then: Joi.string().uuid().required().messages({
      'string.uuid': 'Loan ID must be a valid UUID',
      'any.required': 'Loan ID is required for loan repayment expenses',
    }),
    otherwise: Joi.string().uuid().optional().allow('', null),
  }),

  salaryPaymentType: Joi.string().valid('FULL', 'PARTIAL', 'BONUS').optional().allow('', null),
  salaryMonth: Joi.string().pattern(/^\d{4}-\d{2}$/).optional().allow('', null).messages({
    'string.pattern.base': 'Salary month must be in YYYY-MM format',
  }),
});

const updateExpenseSchema = Joi.object({
  category: Joi.string().max(100).optional().messages({
    'string.max': 'Category name must not exceed 100 characters',
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
    otherwise: Joi.string().uuid().optional().allow('', null),
  }),

  loanId: Joi.when('category', {
    is: EXPENSE_CATEGORIES.LOAN_REPAYMENT,
    then: Joi.string().uuid().required().messages({
      'string.uuid': 'Loan ID must be a valid UUID',
      'any.required': 'Loan ID is required for loan repayment expenses',
    }),
    otherwise: Joi.string().uuid().optional().allow('', null),
  }),

  salaryPaymentType: Joi.string().valid('FULL', 'PARTIAL', 'BONUS').optional().allow('', null),
  salaryMonth: Joi.string().pattern(/^\d{4}-\d{2}$/).optional().allow('', null).messages({
    'string.pattern.base': 'Salary month must be in YYYY-MM format',
  }),
});

const expenseQuerySchema = Joi.object({
  shipId: Joi.string().uuid().optional().messages({
    'string.uuid': 'Ship ID must be a valid UUID',
  }),

  category: Joi.string().max(100).optional(),

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
  limit: Joi.number().integer().min(1).max(1000).optional().default(10),
});

const createCustomCategorySchema = Joi.object({
  name: Joi.string()
    .pattern(/^[A-Z0-9_]+$/)
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.pattern.base': 'Category name must be uppercase letters, numbers, and underscores only (e.g., FUEL_COST)',
      'string.min': 'Category name must be at least 3 characters',
      'string.max': 'Category name must not exceed 100 characters',
      'any.required': 'Category name is required',
    }),

  label: Joi.string().max(150).required().messages({
    'string.max': 'Label must not exceed 150 characters',
    'any.required': 'Label is required',
  }),

  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .default('#7C3AED')
    .messages({
      'string.pattern.base': 'Color must be a valid hex color code (e.g., #7C3AED)',
    }),

  fade: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .default('#F5F3FF')
    .messages({
      'string.pattern.base': 'Fade color must be a valid hex color code (e.g., #F5F3FF)',
    }),

  border: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .default('#DDD6FE')
    .messages({
      'string.pattern.base': 'Border color must be a valid hex color code (e.g., #DDD6FE)',
    }),
});

module.exports = {
  createExpenseSchema,
  updateExpenseSchema,
  expenseQuerySchema,
  createCustomCategorySchema,
};
