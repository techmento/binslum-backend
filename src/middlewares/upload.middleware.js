const multer = require('multer');
const path = require('path');
const { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, HTTP_STATUS } = require('../config/constants');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`), false);
  }
};

// Create upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// Error handling middleware for multer
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Too many files',
      });
    }
  } else if (err) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

module.exports = { upload, multerErrorHandler };
