const Joi = require('joi');
const { USER_ROLES } = require('../../config/constants');

const createUserSchema = Joi.object({
  name: Joi.string()
    .max(100)
    .required()
    .messages({ 'any.required': 'Name is required' }),
  email: Joi.string()
    .email()
    .required()
    .messages({ 'any.required': 'Email is required' }),
  password: Joi.string()
    .min(8)
    .required()
    .messages({ 'any.required': 'Password is required', 'string.min': 'Password must be at least 8 characters' }),
  role: Joi.string()
    .valid(USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT, USER_ROLES.MANAGER)
    .default(USER_ROLES.ACCOUNTANT)
    .messages({ 'string.valid': 'Invalid role' }),
});

const updateUserSchema = Joi.object({
  name: Joi.string().max(100),
  role: Joi.string().valid(USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT, USER_ROLES.MANAGER),
  isActive: Joi.boolean(),
}).min(1);

module.exports = {
  createUserSchema,
  updateUserSchema,
};
