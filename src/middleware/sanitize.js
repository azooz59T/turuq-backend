/**
 * Recursively strip object keys that look like MongoDB query operators (`$...`)
 * or dotted paths (`a.b`) — the vectors for NoSQL-operator injection
 * (e.g. `{ "email": { "$gt": "" } }`). Mutates the object in place.
 */
function stripDangerousKeys(value) {
  if (Array.isArray(value)) {
    value.forEach(stripDangerousKeys);
    return;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete value[key];
      } else {
        stripDangerousKeys(value[key]);
      }
    }
  }
}

/**
 * Global NoSQL-injection sanitizer. Cleans `req.body` (the realistic vector,
 * since JSON bodies can nest operator objects). Mutating in place keeps it
 * Express 5-safe. `req.params` values are always strings from the URL path, and
 * `req.query` is read-only in Express 5 and validated/coerced per route — so
 * neither needs mutation here.
 */
export default function sanitize(req, _res, next) {
  if (req.body && typeof req.body === 'object') stripDangerousKeys(req.body);
  next();
}
