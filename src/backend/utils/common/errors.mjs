/**
 * Common error classes and utilities
 */

// Base API Error class
export class APIError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error
export class ValidationError extends APIError {
  constructor(message, details = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'BizError'; // Set name to BizError for compatibility
    this.details = details;
  }
}

// Authentication error
export class AuthenticationError extends APIError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

// Authorization error
export class AuthorizationError extends APIError {
  constructor(message = 'Not authorized to perform this action') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

// Not found error
export class NotFoundError extends APIError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

// Create error utility function
export function createError(type, message, details) {
  switch (type) {
    case 'validation':
      return new ValidationError(message, details);
    case 'badRequest':
      return new ValidationError(message, details); // badRequest maps to ValidationError (400)
    case 'authentication':
      return new AuthenticationError(message);
    case 'authorization':
      return new AuthorizationError(message);
    case 'notFound':
      return new NotFoundError(message);
    case 'internal':
      return new APIError(message, 500, 'INTERNAL_ERROR');
    default:
      return new APIError(message);
  }
}

// Format error for API response
export function formatErrorResponse(error) {
  const response = {
    error: {
      message: error.message || 'An unexpected error occurred',
      code: error.errorCode || 'INTERNAL_ERROR'
    }
  };

  if (error.details) {
    response.error.details = error.details;
  }

  return response;
}
