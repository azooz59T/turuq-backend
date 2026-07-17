import ApiError from '../utils/ApiError.js';

/**
 * Middleware factory: validate a request part (default `body`) against a Zod
 * schema. On success the raw input is replaced with the parsed/normalized value
 * (trimmed strings, lowercased email, unknown keys stripped). On failure a 400
 * ApiError with per-field messages is forwarded to the central error handler.
 *
 * Note: targets writable parts (`body`, `params`). `req.query` is read-only in
 * Express 5, so query validation is handled differently where needed.
 */
export default function validate(schema, part = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const details = result.error.issues.map(
        (issue) => `${issue.path.join('.') || part}: ${issue.message}`
      );
      return next(ApiError.badRequest('Validation failed', details));
    }
    req[part] = result.data;
    next();
  };
}
