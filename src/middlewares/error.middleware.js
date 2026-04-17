const { HTTP_STATUS } = require('../config/constants');

const errorHandler = (err, req, res, next) => {
  // Log error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err);
  }

  let statusCode = err.statusCode || HTTP_STATUS.SERVER_ERROR;
  let message = err.message || 'Internal server error';
  let errors = [];

  // Handle Prisma P2002 - Unique constraint violation
  if (err.code === 'P2002') {
    statusCode = HTTP_STATUS.CONFLICT;
    message = `Unique constraint failed on field: ${err.meta?.target?.[0] || 'unknown'}`;
  }

  // Handle Prisma P2025 - Record not found
  if (err.code === 'P2025') {
    statusCode = HTTP_STATUS.NOT_FOUND;
    message = 'Record not found';
  }

  // Handle Prisma P2003 - Foreign key constraint failed
  if (err.code === 'P2003') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = `Referenced record not found: ${err.meta?.field_name || 'unknown field'}`;
  }

  // Handle Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.UNPROCESSABLE;
    message = 'Validation error';
    errors = err.errors || [];
  }

  // Build response
  const response = {
    success: false,
    message,
  };

  if (errors.length > 0) {
    response.errors = errors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
