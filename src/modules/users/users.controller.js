const { sendSuccess, sendError } = require('../../utils/apiResponse');
const { HTTP_STATUS } = require('../../config/constants');
const usersService = require('./users.service');

const createUser = async (req, res, next) => {
  try {
    const user = await usersService.createUser(req.body);
    sendSuccess(res, user, 'User created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const query = {
      role: req.query.role,
      is_active: req.query.is_active,
      limit: parseInt(req.query.limit) || 20,
      skip: (parseInt(req.query.page) - 1) * parseInt(req.query.limit) || 0,
    };

    const result = await usersService.getAllUsers(query);
    sendSuccess(res, result, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await usersService.getUserById(id);
    sendSuccess(res, user, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await usersService.updateUser(id, req.body);
    sendSuccess(res, user, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

const softDeleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await usersService.softDeleteUser(id);
    sendSuccess(res, user, 'User deactivated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  softDeleteUser,
};