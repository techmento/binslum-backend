// const { HTTP_STATUS } = require('../config/constants');

// const sendSuccess = (res, data, message = 'Success', statusCode = HTTP_STATUS.OK) => {
//   res.status(statusCode).json({
//     success: true,
//     message,
//     data,
//   });
// };

// const sendError = (res, message = 'Error', statusCode = HTTP_STATUS.SERVER_ERROR, errors = []) => {
//   const response = {
//     success: false,
//     message,
//   };

//   if (errors.length > 0) {
//     response.errors = errors;
//   }

//   res.status(statusCode).json(response);
// };

// module.exports = {
//   sendSuccess,
//   sendError,
// };





const { HTTP_STATUS } = require('../config/constants');

const sendSuccess = (res, data, message = 'Success', statusCode = HTTP_STATUS.OK) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, message = 'Error', statusCode = HTTP_STATUS.SERVER_ERROR, errors = []) => {
  const response = {
    success: false,
    message,
  };

  if (errors.length > 0) {
    response.errors = errors;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError,
};