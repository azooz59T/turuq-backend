import { isProd } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

/**
 * Central Express error handler.
 *
 * Must keep the 4-argument signature (err, req, res, next) so Express treats it
 * as an error-handling middleware. Any error passed to `next(err)` anywhere in
 * the app ends up here and is rendered as a consistent JSON envelope.
 */
// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  let error = err;

  // Normalise anything that isn't already an ApiError into one.
  if (!(error instanceof ApiError)) {
    const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
    error = new ApiError(statusCode, error.message || 'Internal Server Error');
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
