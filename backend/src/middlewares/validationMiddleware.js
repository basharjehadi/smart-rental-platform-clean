/**
 * Validation middleware using Joi schemas
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Replace request data with validated data
    req[property] = value;
    next();
  };
};

/**
 * Async validation middleware for complex validation logic
 * @param {Function} validator - Async validation function
 * @returns {Function} Express middleware function
 */
export const validateAsync = (validator) => {
  return async (req, res, next) => {
    try {
      await validator(req, res);
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: error.message
      });
    }
  };
}; 