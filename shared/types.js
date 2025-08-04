/**
 * Shared types and constants for Smart Rental System
 */

// User roles
export const USER_ROLES = {
  TENANT: 'TENANT',
  LANDLORD: 'LANDLORD',
  ADMIN: 'ADMIN'
};

// Property types
export const PROPERTY_TYPES = {
  APARTMENT: 'APARTMENT',
  HOUSE: 'HOUSE',
  STUDIO: 'STUDIO',
  ROOM: 'ROOM',
  OFFICE: 'OFFICE'
};

// Rental request status
export const RENTAL_REQUEST_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  LOCKED: 'LOCKED'
};

// Offer status
export const OFFER_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
};

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

// Payment purpose
export const PAYMENT_PURPOSE = {
  RENT: 'RENT',
  DEPOSIT: 'DEPOSIT',
  FEES: 'FEES'
};

// Contract status
export const CONTRACT_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_SIGNATURE: 'PENDING_SIGNATURE',
  SIGNED: 'SIGNED',
  EXPIRED: 'EXPIRED',
  TERMINATED: 'TERMINATED'
};

// File types
export const FILE_TYPES = {
  PROFILE_IMAGE: 'PROFILE_IMAGE',
  PROPERTY_IMAGE: 'PROPERTY_IMAGE',
  PROPERTY_VIDEO: 'PROPERTY_VIDEO',
  IDENTITY_DOCUMENT: 'IDENTITY_DOCUMENT',
  CONTRACT: 'CONTRACT',
  RULES: 'RULES'
};

// API response status
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning'
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
};

// Validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please provide a valid email address',
  PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters long',
  PASSWORD_MISMATCH: 'Passwords do not match',
  INVALID_PHONE: 'Please provide a valid phone number',
  INVALID_POSTAL_CODE: 'Please provide a valid postal code',
  FILE_TOO_LARGE: 'File size is too large',
  INVALID_FILE_TYPE: 'Invalid file type',
  INVALID_DATE: 'Please provide a valid date',
  FUTURE_DATE_REQUIRED: 'Date must be in the future'
};

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database error occurred',
  FILE_UPLOAD_ERROR: 'File upload failed',
  EMAIL_ERROR: 'Email sending failed',
  PAYMENT_ERROR: 'Payment processing failed'
};

// Success messages
export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  PROPERTY_CREATED: 'Property created successfully',
  PROPERTY_UPDATED: 'Property updated successfully',
  PROPERTY_DELETED: 'Property deleted successfully',
  REQUEST_CREATED: 'Rental request created successfully',
  OFFER_CREATED: 'Offer created successfully',
  PAYMENT_SUCCESS: 'Payment completed successfully',
  CONTRACT_GENERATED: 'Contract generated successfully'
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
};

// Currency
export const CURRENCY = {
  CODE: 'PLN',
  SYMBOL: 'zł',
  NAME: 'Polish Złoty'
};

// File size limits (in bytes)
export const FILE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  VIDEO: 50 * 1024 * 1024, // 50MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  PROFILE_IMAGE: 2 * 1024 * 1024 // 2MB
};

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  VIDEO: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
}; 