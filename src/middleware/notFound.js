import ApiError from '../utils/ApiError.js';

/**
 * Catch-all for requests that match no route.
 * Forwards a 404 ApiError to the central error handler.
 */
export default function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
