import jwt from 'jsonwebtoken';
import env from '../config/env.js';

if (!env.jwtSecret) {
  // Fail loudly at startup rather than issuing unsigned/insecure tokens later.
  throw new Error('JWT_SECRET is not set. Add it to your .env file (see .env.example).');
}

/** Sign a JWT for the given payload. */
export function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

/** Verify a JWT and return its decoded payload (throws if invalid/expired). */
export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
