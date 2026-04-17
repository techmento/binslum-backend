const Joi = require('joi');
const { EXPENSE_CATEGORIES, INCOME_TYPES } = require('../../config/constants');

const reportQuerySchema = Joi.object({
  shipId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Ship ID must be a valid UUID',
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
});

const expenseReportQuerySchema = Joi.object({
  shipId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Ship ID must be a valid UUID',
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
  category: Joi.string()
    .valid(...Object.values(EXPENSE_CATEGORIES))
    .optional()
    .messages({
      'any.only': `Category must be one of: ${Object.values(EXPENSE_CATEGORIES).join(', ')}`,
    }),
});

const incomeReportQuerySchema = Joi.object({
  shipId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Ship ID must be a valid UUID',
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
  type: Joi.string()
    .valid(...Object.values(INCOME_TYPES))
    .optional()
    .messages({
      'any.only': `Type must be one of: ${Object.values(INCOME_TYPES).join(', ')}`,
    }),
});

const shipPerformanceQuerySchema = Joi.object({
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
});

module.exports = {
  reportQuerySchema,
  expenseReportQuerySchema,
  incomeReportQuerySchema,
  shipPerformanceQuerySchema,
};