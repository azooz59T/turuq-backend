import request from 'supertest';
import app from '../src/app.js';

let counter = 0;

/**
 * Register a fresh account and return its JWT (+ email).
 * Used by protected-endpoint tests to obtain a valid Bearer token.
 */
export async function authAgent() {
  const email = `tester_${Date.now()}_${counter++}@example.com`;
  const res = await request(app)
    .post('/auth/register')
    .send({ email, password: 'password123' });
  return { token: res.body.data.token, email };
}
