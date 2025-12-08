/**
 * Error handling middleware for Express
 */
import { 
  createError, 
  APIError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError,
  formatErrorResponse
} from '../utils/common/errors.mjs';
import logger from '../utils/logging/logger.mjs';

/**
 * Global error handling middleware for Express
 */
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let errorMessage = err.message || 'Internal Server Error';
  let errorCode = err.errorCode || 'INTERNAL_ERROR';
  let errorDetails = err.details || null;
  
  // Log the error
  if (statusCode >= 500) {
    logger.error(`${statusCode} Error:`, { 
      error: err.message, 
      stack: err.stack,
      path: req.path
    });
  } else {
    logger.warn(`${statusCode} Error:`, { 
      error: err.message,
      path: req.path
    });
  }

  // Format the error response
  const errorResponse = {
    error: {
      message: errorMessage,
      code: errorCode
    }
  };

  // Add error details if available
  if (errorDetails) {
    errorResponse.error.details = errorDetails;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Re-export error classes and utilities from common/errors.mjs
export { 
  createError, 
  APIError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError 
};
