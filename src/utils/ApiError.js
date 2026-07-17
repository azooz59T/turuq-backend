/**
 * Operational error carrying an HTTP status code.
 *
 * Controllers/services throw these for expected failure conditions (bad input,
 * missing resource, conflict, …). The central error handler recognises them and
 * turns them into a clean JSON response, while any *unexpected* error falls
 * through to a generic 500.
 */
export default class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status code
   * @param {string} message    human-readable message
   * @param {*}      [details]  optional extra info (e.g. field validation errors)
   */
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message, details) {
    return new ApiError(409, message, details);
  }
}
