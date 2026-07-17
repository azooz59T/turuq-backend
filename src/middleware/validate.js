import ApiError from '../utils/ApiError.js';

/**
 * Middleware factory: validate a request part (default `body`) against a Zod
 * schema. On success the raw input is replaced with the parsed/normalized value
 * (trimmed strings, lowercased email, unknown keys stripped). On failure a 400
 * ApiError with per-field messages is forwarded to the central error handler.
 *
 * Note: `req.query` is read-only in Express 5, so when `part === 'query'` the
 * parsed result is stashed on `req.validatedQuery` instead of reassigning it.
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
    // req.query is read-only in Express 5, so stash the parsed query separately.
    if (part === 'query') req.validatedQuery = result.data;
    else req[part] = result.data;
    next();
  };
}
