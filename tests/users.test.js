import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { authAgent } from './helpers.js';

describe('/users (protected)', () => {
  let token;
  beforeEach(async () => {
    ({ token } = await authAgent());
  });
  const auth = (req) => req.set('Authorization', `Bearer ${token}`);

  it('rejects requests without a token (401)', async () => {
    const res = await request(app).get('/users');
    expect(res.status).toBe(401);
  });

  it('creates a user (201)', async () => {
    const res = await auth(request(app).post('/users')).send({
      name: 'Sara',
      email: 'sara@example.com',
      age: 30,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeTruthy();
    expect(res.body.data.email).toBe('sara@example.com');
  });

  it('validates the request body (400)', async () => {
    const res = await auth(request(app).post('/users')).send({ email: 'nope' });
    expect(res.status).toBe(400);
  });

  it('rejects a duplicate email (409)', async () => {
    await auth(request(app).post('/users')).send({ name: 'A', email: 'dup@x.com' });
    const res = await auth(request(app).post('/users')).send({ name: 'B', email: 'dup@x.com' });
    expect(res.status).toBe(409);
  });

  it('lists users with pagination metadata', async () => {
    for (const age of [20, 25, 30]) {
      await auth(request(app).post('/users')).send({ name: `U${age}`, email: `u${age}@x.com`, age });
    }
    const res = await auth(request(app).get('/users?limit=2'));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(3);
    expect(res.body.pagination.totalPages).toBe(2);
  });

  it('filters by age range', async () => {
    for (const age of [20, 30, 40]) {
      await auth(request(app).post('/users')).send({ name: `U${age}`, email: `u${age}@x.com`, age });
    }
    const res = await auth(request(app).get('/users?minAge=25&maxAge=35'));
    expect(res.body.data.map((u) => u.age)).toEqual([30]);
  });

  it('gets a user by id and 404s for a missing one', async () => {
    const created = await auth(request(app).post('/users')).send({ name: 'X', email: 'x@x.com' });
    const id = created.body.data.id;
    expect((await auth(request(app).get(`/users/${id}`))).status).toBe(200);
    expect((await auth(request(app).get('/users/0123456789abcdef01234567'))).status).toBe(404);
  });

  it('returns 400 for an invalid id', async () => {
    const res = await auth(request(app).get('/users/not-an-id'));
    expect(res.status).toBe(400);
  });

  it('updates a user (200)', async () => {
    const created = await auth(request(app).post('/users')).send({ name: 'X', email: 'x@x.com', age: 20 });
    const res = await auth(request(app).put(`/users/${created.body.data.id}`)).send({ age: 21 });
    expect(res.status).toBe(200);
    expect(res.body.data.age).toBe(21);
  });

  it('deletes a user (200) then 404s', async () => {
    const created = await auth(request(app).post('/users')).send({ name: 'X', email: 'x@x.com' });
    const id = created.body.data.id;
    expect((await auth(request(app).delete(`/users/${id}`))).status).toBe(200);
    expect((await auth(request(app).get(`/users/${id}`))).status).toBe(404);
  });
});
