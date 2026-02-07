/**
 * Validation utilities module
 */

// Schema validation function
const validateSchema = (data, schema) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    return { 
      valid: false, 
      errors: error.details.map(detail => detail.message)
    };
  }
  return { valid: true, value };
};

// Input sanitization to prevent XSS
const sanitizeInput = (input) => {
  // Basic sanitization
  if (typeof input === 'string') {
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  } else if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
};

// Export a default object with all validation utilities
export default {
  validateSchema,
  sanitizeInput,
  
  // Common validation methods
  isEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  isStrongPassword: (password) => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password);
  },
  
  isValidUsername: (username) => {
    // Alphanumeric, 3-20 chars
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  }
};
