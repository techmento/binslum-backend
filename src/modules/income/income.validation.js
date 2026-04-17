const Joi = require('joi');
const { INCOME_TYPES } = require('../../config/constants');

const createIncomeSchema = Joi.object({
  shipId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Ship ID must be a valid UUID',
      'any.required': 'Ship ID is required',
    }),
  type: Joi.string()
    .valid(...Object.values(INCOME_TYPES))
    .required()
    .messages({
      'any.only': `Type must be one of: ${Object.values(INCOME_TYPES).join(', ')}`,
      'any.required': 'Income type is required',
    }),
  amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Amount must be positive',
      'number.base': 'Amount must be a number',
      'any.required': 'Amount is required',
    }),
  date: Joi.date()
    .iso()
    .required()
    .messages({
      'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
      'any.required': 'Date is required',
    }),
  description: Joi.string()
    .max(1000)
    .allow('')
    .optional(),
});

const updateIncomeSchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(INCOME_TYPES))
    .optional()
    .messages({
      'any.only': `Type must be one of: ${Object.values(INCOME_TYPES).join(', ')}`,
    }),
  amount: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.positive': 'Amount must be positive',
      'number.base': 'Amount must be a number',
    }),
  date: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
    }),
  description: Joi.string()
    .max(1000)
    .allow('')
    .optional(),
}).min(1);

const incomeQuerySchema = Joi.object({
  shipId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Ship ID must be a valid UUID',
    }),
  type: Joi.string()
    .valid(...Object.values(INCOME_TYPES))
    .optional()
    .messages({
      'any.only': `Type must be one of: ${Object.values(INCOME_TYPES).join(', ')}`,
    }),
  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
    }),
  endDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
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

module.exports = {
  createIncomeSchema,
  updateIncomeSchema,
  incomeQuerySchema,
};