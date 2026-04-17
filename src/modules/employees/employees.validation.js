const Joi = require('joi');

const createEmployeeSchema = Joi.object({
  shipId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Ship ID must be a valid UUID',
      'any.required': 'Ship ID is required',
    }),
  name: Joi.string()
    .max(150)
    .required()
    .messages({
      'any.required': 'Employee name is required',
      'string.max': 'Employee name must not exceed 150 characters',
    }),
  role: Joi.string()
    .max(100)
    .required()
    .messages({
      'any.required': 'Employee role is required',
      'string.max': 'Employee role must not exceed 100 characters',
    }),
  baseSalary: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Base salary must be positive',
      'number.base': 'Base salary must be a number',
      'any.required': 'Base salary is required',
    }),
  allowances: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .default(0)
    .messages({
      'number.min': 'Allowances must be non-negative',
      'number.base': 'Allowances must be a number',
    }),
  deductions: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .default(0)
    .messages({
      'number.min': 'Deductions must be non-negative',
      'number.base': 'Deductions must be a number',
    }),
  taxRate: Joi.number()
    .min(0)
    .max(100)
    .precision(2)
    .optional()
    .default(0)
    .messages({
      'number.min': 'Tax rate must be non-negative',
      'number.max': 'Tax rate must not exceed 100%',
      'number.base': 'Tax rate must be a number',
    }),
});

const updateEmployeeSchema = Joi.object({
  shipId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Ship ID must be a valid UUID',
    }),
  name: Joi.string()
    .max(150)
    .optional()
    .messages({
      'string.max': 'Employee name must not exceed 150 characters',
    }),
  role: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Employee role must not exceed 100 characters',
    }),
  baseSalary: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.positive': 'Base salary must be positive',
      'number.base': 'Base salary must be a number',
    }),
  allowances: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .messages({
      'number.min': 'Allowances must be non-negative',
      'number.base': 'Allowances must be a number',
    }),
  deductions: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .messages({
      'number.min': 'Deductions must be non-negative',
      'number.base': 'Deductions must be a number',
    }),
  taxRate: Joi.number()
    .min(0)
    .max(100)
    .precision(2)
    .optional()
    .messages({
      'number.min': 'Tax rate must be non-negative',
      'number.max': 'Tax rate must not exceed 100%',
      'number.base': 'Tax rate must be a number',
    }),
  isActive: Joi.boolean().optional(),
}).min(1);

const employeeQuerySchema = Joi.object({
  shipId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Ship ID must be a valid UUID',
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
    .default(20),
});

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeQuerySchema,
};