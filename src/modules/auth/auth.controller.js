const { sendSuccess, sendError } = require('../../utils/apiResponse');
const { HTTP_STATUS } = require('../../config/constants');
const authService = require('./auth.service');

const login = async (req, res, next) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);
  sendSuccess(res, result, 'Login successful', HTTP_STATUS.OK);
};

const getCurrentUser = async (req, res, next) => {
  const user = await authService.getCurrentUser(req.user.id);
  sendSuccess(res, user, 'User profile retrieved', HTTP_STATUS.OK);
};

module.exports = {
  login,
  getCurrentUser,
};
