const { errorResponse } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', err);
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  } else {
    // Production Mode
    if (err.isOperational) {
      return errorResponse(res, err.message, err.statusCode);
    }
    
    // Log unexpected/programming errors
    console.error('Unexpected Error:', err);
    return errorResponse(res, 'Something went wrong on the server', 500);
  }
};

module.exports = errorHandler;
