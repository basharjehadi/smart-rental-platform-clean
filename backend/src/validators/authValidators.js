import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional().allow(''),
  firstName: Joi.string().min(1).max(50).optional().allow(''),
  lastName: Joi.string().min(1).max(50).optional().allow(''),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  role: Joi.string().valid('TENANT', 'LANDLORD', 'ADMIN').default('TENANT').messages({
    'any.only': 'Role must be one of: TENANT, LANDLORD, ADMIN'
  })
}).custom((value, helpers) => {
  const hasFullName = value.name && value.name.trim().length > 0;
  const hasFirstLast = value.firstName && value.lastName && value.firstName.trim().length > 0 && value.lastName.trim().length > 0;
  if (!hasFullName && !hasFirstLast) {
    return helpers.error('any.custom', 'Provide either name or firstName and lastName');
  }
  return value;
}, 'name validation');

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'any.required': 'New password is required'
  })
}); 