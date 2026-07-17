import ApiError from '../utils/ApiError.js';
import { verifyToken } from '../utils/jwt.js';

/**
 * Route guard: requires a valid `Authorization: Bearer <token>` header.
 * On success, attaches the decoded token payload to `req.account`.
 * On failure, forwards a 401 to the central error handler.
 */
export default function requireAuth(req, _res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'));
  }

  try {
    req.account = verifyToken(token);
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}
