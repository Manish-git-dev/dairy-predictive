const ApiError = require('../utils/ApiError');

const isProduction = process.env.NODE_ENV === 'production';

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err instanceof SyntaxError && err.status === 400 && err.type === 'entity.parse.failed') {
    error = new ApiError(400, 'Malformed JSON request body');
  } else if (err.name === 'CastError') {
    error = new ApiError(400, 'Invalid resource identifier');
  } else if (err.code === 11000) {
    const fields = Object.keys(err.keyPattern || err.keyValue || {});
    error = new ApiError(409, fields.length ? `Duplicate value for: ${fields.join(', ')}` : 'Duplicate resource');
  } else if (err.name === 'ValidationError') {
    const message = Object.values(err.errors || {})
      .map((value) => value.message)
      .filter(Boolean)
      .join(', ');
    error = new ApiError(400, message || 'Validation failed');
  } else if (err.name === 'ZodError') {
    const message = err.errors
      .map((item) => `${item.path.join('.') || 'request'}: ${item.message}`)
      .join(', ');
    error = new ApiError(400, `Validation Error: ${message}`);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token is invalid or expired');
  } else if (err.name === 'MongoServerSelectionError' || err.name === 'MongooseServerSelectionError' || err.name === 'MongoNetworkError') {
    error = new ApiError(503, 'Database service is temporarily unavailable', false);
  }

  const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
  const isOperational = error?.isOperational !== false && statusCode < 500;
  const requestId = req.requestId;

  if (statusCode >= 500 && !isProduction) {
    console.error(`[${requestId || 'no-request-id'}]`, err);
  } else if (statusCode >= 500) {
    console.error(`[${requestId || 'no-request-id'}] ${err?.name || 'Error'}: ${err?.message || 'Unknown error'}`);
  }

  if (error?.retryAfterSeconds) {
    res.setHeader('Retry-After', String(error.retryAfterSeconds));
  }

  const response = {
    success: false,
    error: {
      message: isOperational || statusCode < 500 ? (error?.message || 'Request failed') : 'Internal server error',
      code: statusCode,
      requestId
    }
  };

  if (!isProduction && err?.stack) {
    response.error.details = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
