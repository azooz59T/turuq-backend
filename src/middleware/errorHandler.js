import { isProd } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

/**
 * Translate common Mongoose errors into clean ApiErrors with the right status.
 * Returns null if the error isn't a recognised Mongoose error.
 */
function fromMongooseError(err) {
  // Invalid ObjectId / failed cast (e.g. GET /users/not-an-id) → 400
  if (err.name === 'CastError') {
    return new ApiError(400, `Invalid value for '${err.path}': ${err.value}`);
  }
  // Schema validation failed → 400 with per-field messages
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return new ApiError(400, 'Validation failed', details);
  }
  // Duplicate key on a unique index (e.g. email) → 409
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    return new ApiError(409, `A record with this ${field} already exists`, err.keyValue);
  }
  return null;
}

/**
 * Central Express error handler.
 *
 * Must keep the 4-argument signature (err, req, res, next) so Express treats it
 * as error-handling middleware. Any error thrown in a handler or passed to
 * `next(err)` ends up here and is rendered as a consistent JSON envelope.
 */
// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  let error = err instanceof ApiError ? err : fromMongooseError(err);

  // Anything still unhandled becomes its own ApiError (defaults to 500).
  if (!error) {
    const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
    error = new ApiError(statusCode, err.message || 'Internal Server Error');
  }

  const payload = {
    success: false,
    message: error.message,
  };
  if (error.details) payload.details = error.details;
  // Never leak stack traces in production.
  if (!isProd) payload.stack = err.stack;

  res.status(error.statusCode).json(payload);
}
