import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('POST /auth/register', () => {
  it('creates an account and returns a token', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'a@b.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.account.password).toBeUndefined(); // never leak the hash
  });

  it('rejects a duplicate email with 409', async () => {
    const creds = { email: 'dupe@b.com', password: 'password123' };
    await request(app).post('/auth/register').send(creds);
    const res = await request(app).post('/auth/register').send(creds);
    expect(res.status).toBe(409);
  });

  it('rejects invalid input with 400', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'bad', password: '123' });
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  const creds = { email: 'login@b.com', password: 'password123' };

  it('logs in with correct credentials', async () => {
    await request(app).post('/auth/register').send(creds);
    const res = await request(app).post('/auth/login').send(creds);
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
  });

  it('rejects a wrong password with 401', async () => {
    await request(app).post('/auth/register').send(creds);
    const res = await request(app).post('/auth/login').send({ ...creds, password: 'wrong' });
    expect(res.status).toBe(401);
  });
});
