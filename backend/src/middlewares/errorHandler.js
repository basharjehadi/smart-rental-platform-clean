// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user?.id,
  });

  // Handle Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'This record already exists',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Record not found',
      message: 'The requested record was not found',
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: err.message,
      details: err.details,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Please log in again',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      message: 'Please log in again',
    });
  }

  // Handle file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      message: 'File size exceeds the limit',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected file',
      message: 'Unexpected file field',
    });
  }

  // Handle Stripe errors
  if (err.type === 'StripeCardError') {
    return res.status(400).json({
      error: 'Payment failed',
      message: err.message,
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: 'Something went wrong',
    message:
      process.env.NODE_ENV === 'development'
        ? message
        : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    path: req.originalUrl,
  });
};
