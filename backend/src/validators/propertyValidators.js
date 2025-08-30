import Joi from 'joi';

export const createPropertySchema = Joi.object({
  title: Joi.string().min(5).max(100).required().messages({
    'string.min': 'Title must be at least 5 characters long',
    'string.max': 'Title cannot exceed 100 characters',
    'any.required': 'Title is required',
  }),
  description: Joi.string().min(10).max(1000).optional().messages({
    'string.min': 'Description must be at least 10 characters long',
    'string.max': 'Description cannot exceed 1000 characters',
  }),
  address: Joi.string().min(5).max(200).required().messages({
    'string.min': 'Address must be at least 5 characters long',
    'string.max': 'Address cannot exceed 200 characters',
    'any.required': 'Address is required',
  }),
  city: Joi.string().min(2).max(50).required().messages({
    'string.min': 'City must be at least 2 characters long',
    'string.max': 'City cannot exceed 50 characters',
    'any.required': 'City is required',
  }),
  postalCode: Joi.string()
    .pattern(/^\d{2}-\d{3}$/)
    .required()
    .messages({
      'string.pattern.base': 'Postal code must be in format XX-XXX',
      'any.required': 'Postal code is required',
    }),
  rentAmount: Joi.number().positive().required().messages({
    'number.base': 'Rent amount must be a number',
    'number.positive': 'Rent amount must be positive',
    'any.required': 'Rent amount is required',
  }),
  depositAmount: Joi.number().positive().optional().messages({
    'number.base': 'Deposit amount must be a number',
    'number.positive': 'Deposit amount must be positive',
  }),
  bedrooms: Joi.number().integer().min(0).max(10).required().messages({
    'number.base': 'Bedrooms must be a number',
    'number.integer': 'Bedrooms must be a whole number',
    'number.min': 'Bedrooms cannot be negative',
    'number.max': 'Bedrooms cannot exceed 10',
    'any.required': 'Number of bedrooms is required',
  }),
  bathrooms: Joi.number().integer().min(0).max(5).required().messages({
    'number.base': 'Bathrooms must be a number',
    'number.integer': 'Bathrooms must be a whole number',
    'number.min': 'Bathrooms cannot be negative',
    'number.max': 'Bathrooms cannot exceed 5',
    'any.required': 'Number of bathrooms is required',
  }),
  area: Joi.number().positive().optional().messages({
    'number.base': 'Area must be a number',
    'number.positive': 'Area must be positive',
  }),
  furnished: Joi.boolean().default(false),
  parking: Joi.boolean().default(false),
  petsAllowed: Joi.boolean().default(false),
  availableFrom: Joi.date().iso().min('now').required().messages({
    'date.base': 'Available from must be a valid date',
    'date.min': 'Available from date must be in the future',
    'any.required': 'Available from date is required',
  }),
  utilitiesIncluded: Joi.boolean().default(false),
});

export const updatePropertySchema = Joi.object({
  title: Joi.string().min(5).max(100).optional(),
  description: Joi.string().min(10).max(1000).optional(),
  address: Joi.string().min(5).max(200).optional(),
  city: Joi.string().min(2).max(50).optional(),
  postalCode: Joi.string()
    .pattern(/^\d{2}-\d{3}$/)
    .optional(),
  rentAmount: Joi.number().positive().optional(),
  depositAmount: Joi.number().positive().optional(),
  bedrooms: Joi.number().integer().min(0).max(10).optional(),
  bathrooms: Joi.number().integer().min(0).max(5).optional(),
  area: Joi.number().positive().optional(),
  furnished: Joi.boolean().optional(),
  parking: Joi.boolean().optional(),
  petsAllowed: Joi.boolean().optional(),
  availableFrom: Joi.date().iso().min('now').optional(),
  utilitiesIncluded: Joi.boolean().optional(),
});

export const propertyQuerySchema = Joi.object({
  city: Joi.string().optional(),
  minRent: Joi.number().positive().optional(),
  maxRent: Joi.number().positive().optional(),
  bedrooms: Joi.number().integer().min(0).optional(),
  furnished: Joi.boolean().optional(),
  petsAllowed: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});
