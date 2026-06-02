const Joi = require('joi');
const { USER_ROLES } = require('../../config/constants');

const ALL_ROLES = [USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT, USER_ROLES.MANAGER, USER_ROLES.VIEWER];

const createUserSchema = Joi.object({
  name: Joi.string().max(100).required().messages({ 'any.required': 'Name is required' }),
  email: Joi.string().email().required().messages({ 'any.required': 'Email is required' }),
  password: Joi.string().min(8).required().messages({ 'any.required': 'Password is required', 'string.min': 'Password must be at least 8 characters' }),
  role: Joi.string().valid(...ALL_ROLES).default(USER_ROLES.VIEWER).messages({ 'any.only': 'Invalid role' }),
});

const updateUserSchema = Joi.object({
  name:     Joi.string().max(100).optional(),
  role:     Joi.string().valid(...ALL_ROLES).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).required().messages({ 'any.required': 'New password is required', 'string.min': 'Password must be at least 8 characters' }),
});

module.exports = { createUserSchema, updateUserSchema, resetPasswordSchema };
