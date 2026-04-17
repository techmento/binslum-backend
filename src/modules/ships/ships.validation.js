const Joi = require('joi');
const { SHIP_STATUS } = require('../../config/constants');

const createShipSchema = Joi.object({
  name: Joi.string()
    .max(150)
    .required()
    .messages({
      'any.required': 'Ship name is required',
      'string.max': 'Ship name must not exceed 150 characters',
    }),
  registrationNumber: Joi.string()
    .max(100)
    .required()
    .messages({
      'any.required': 'Registration number is required',
      'string.max': 'Registration number must not exceed 100 characters',
    }),
  status: Joi.string()
    .valid(...Object.values(SHIP_STATUS))
    .default(SHIP_STATUS.ACTIVE)
    .messages({
      'any.only': `Status must be one of: ${Object.values(SHIP_STATUS).join(', ')}`,
    }),
  description: Joi.string()
    .max(1000)
    .allow('')
    .optional(),
});

const updateShipSchema = Joi.object({
  name: Joi.string()
    .max(150)
    .optional()
    .messages({
      'string.max': 'Ship name must not exceed 150 characters',
    }),
  registrationNumber: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Registration number must not exceed 100 characters',
    }),
  status: Joi.string()
    .valid(...Object.values(SHIP_STATUS))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(SHIP_STATUS).join(', ')}`,
    }),
  description: Joi.string()
    .max(1000)
    .allow('')
    .optional(),
}).min(1);

const shipQuerySchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(SHIP_STATUS))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(SHIP_STATUS).join(', ')}`,
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
  createShipSchema,
  updateShipSchema,
  shipQuerySchema,
};