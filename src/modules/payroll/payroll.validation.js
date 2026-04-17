const Joi = require('joi');

const createPayrollSchema = Joi.object({
  periodStart: Joi.date().iso().required().messages({
    'date.format': 'Period start must be in ISO format (YYYY-MM-DD)',
    'any.required': 'Period start is required',
  }),
  periodEnd: Joi.date().iso().required().messages({
    'date.format': 'Period end must be in ISO format (YYYY-MM-DD)',
    'any.required': 'Period end is required',
  }),
  notes: Joi.string().max(1000).allow('').optional(),
});

const updatePayrollSchema = Joi.object({
  notes: Joi.string().max(1000).allow('').optional(),
});

const processPayrollSchema = Joi.object({
  // No additional fields needed for processing
});

const payrollQuerySchema = Joi.object({
  status: Joi.string().valid('DRAFT', 'PROCESSED', 'PAID').optional(),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
});

module.exports = {
  createPayrollSchema,
  updatePayrollSchema,
  processPayrollSchema,
  payrollQuerySchema,
};