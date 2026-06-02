const { HTTP_STATUS } = require('../config/constants');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true, // converts FormData strings: "123.45" → 123.45, "2024-01-15" → Date
    });

    if (error) {
      const errors = error.details.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(HTTP_STATUS.UNPROCESSABLE).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    req[source] = value;
    next();
  };
};

module.exports = validate;