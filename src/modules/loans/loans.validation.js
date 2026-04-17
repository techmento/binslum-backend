const Joi = require('joi');
const { LOAN_STATUS } = require('../../config/constants');

const createLoanSchema = Joi.object({
  bankName: Joi.string()
    .max(200)
    .required()
    .messages({
      'any.required': 'Bank name is required',
      'string.max': 'Bank name must not exceed 200 characters',
    }),
  totalAmount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Total amount must be positive',
      'number.base': 'Total amount must be a number',
      'any.required': 'Total amount is required',
    }),
  monthlyPayment: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Monthly payment must be positive',
      'number.base': 'Monthly payment must be a number',
      'any.required': 'Monthly payment is required',
    }),
  startDate: Joi.date()
    .iso()
    .required()
    .messages({
      'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
      'any.required': 'Start date is required',
    }),
  description: Joi.string()
    .max(1000)
    .allow('')
    .optional(),
});

const updateLoanSchema = Joi.object({
  bankName: Joi.string()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Bank name must not exceed 200 characters',
    }),
  totalAmount: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.positive': 'Total amount must be positive',
      'number.base': 'Total amount must be a number',
    }),
  monthlyPayment: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.positive': 'Monthly payment must be positive',
      'number.base': 'Monthly payment must be a number',
    }),
  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
    }),
  description: Joi.string()
    .max(1000)
    .allow('')
    .optional(),
}).min(1);

const createLoanPaymentSchema = Joi.object({
  loanId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Loan ID must be a valid UUID',
      'any.required': 'Loan ID is required',
    }),
  amountPaid: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Amount paid must be positive',
      'number.base': 'Amount paid must be a number',
      'any.required': 'Amount paid is required',
    }),
  paymentDate: Joi.date()
    .iso()
    .required()
    .messages({
      'date.format': 'Payment date must be in ISO format (YYYY-MM-DD)',
      'any.required': 'Payment date is required',
    }),
  notes: Joi.string()
    .max(1000)
    .allow('')
    .optional(),
});

const loanQuerySchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(LOAN_STATUS))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(LOAN_STATUS).join(', ')}`,
    }),
  search: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Search term must be at least 1 character',
      'string.max': 'Search term must not exceed 100 characters',
    }),
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10),
});

const loanPaymentQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10),
});

module.exports = {
  createLoanSchema,
  updateLoanSchema,
  createLoanPaymentSchema,
  loanQuerySchema,
  loanPaymentQuerySchema,
};