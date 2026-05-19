// middleware/errorHandler.js
import logger from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  }, 'Unhandled error');

  // Database errors
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Resource already exists',
      details: err.detail,
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Referenced resource does not exist',
      details: err.detail,
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
  });
};
