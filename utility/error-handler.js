// Standardized error handling utility for LSP-OMS APIs

/**
 * Standard error codes for the application
 */
const ERROR_CODES = {
  VALIDATION_ERROR: 'validation-error',
  NOT_FOUND: 'not-found',
  ORDER_CREATION_ERROR: 'order-creation-error',
  ORDER_TRACKING_ERROR: 'order-tracking-error',
  SERVICEABILITY_ERROR: 'serviceability-error',
  CANCELLATION_ERROR: 'cancellation-error',
  STATUS_UPDATE_ERROR: 'status-update-error',
  WEBHOOK_CONFIG_ERROR: 'webhook-config-error',
  INTERNAL_SERVER_ERROR: 'internal-server-error'
};

/**
 * Create a standardized error response object
 * @param {string} code - Error code from ERROR_CODES
 * @param {string} message - User-friendly error message
 * @param {Object} details - Additional error details (optional)
 * @returns {Object} Standardized error object
 */
const createErrorResponse = (code, message, details = null) => {
  const errorResponse = {
    error: {
      code,
      message
    }
  };
  
  if (details) {
    errorResponse.error.details = details;
  }
  
  return errorResponse;
};

/**
 * Send a standardized error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} errorCode - Error code from ERROR_CODES
 * @param {string} message - User-friendly error message
 * @param {Object} details - Additional error details (optional)
 */
const sendErrorResponse = (res, statusCode, errorCode, message, details = null) => {
  return res.status(statusCode).json(createErrorResponse(errorCode, message, details));
};

/**
 * Handle validation errors from Joi
 * @param {Object} res - Express response object
 * @param {Object} error - Joi validation error object
 */
const handleValidationError = (res, error) => {
  return sendErrorResponse(
    res,
    400,
    ERROR_CODES.VALIDATION_ERROR,
    error.details[0].message,
    {
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    }
  );
};

/**
 * Handle internal server errors
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} context - Context where the error occurred (e.g., 'createOrder')
 */
const handleInternalError = (res, error, context) => {
  // Log the error with context for debugging
  console.error(`Error in ${context}:`, error);
  
  return sendErrorResponse(
    res,
    500,
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    'An internal server error occurred'
  );
};

module.exports = {
  ERROR_CODES,
  createErrorResponse,
  sendErrorResponse,
  handleValidationError,
  handleInternalError
};
