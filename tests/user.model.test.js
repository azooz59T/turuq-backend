import { describe, it, expect } from 'vitest';
import User from '../src/models/user.model.js';

// Run async validation and return the ValidationError (or null if valid).
async function validationError(doc) {
  try {
    await doc.validate();
    return null;
  } catch (err) {
    return err;
  }
}

// Unit tests — schema validation only (no DB round-trip).
describe('User model validation', () => {
  it('accepts a valid user', async () => {
    const err = await validationError(new User({ name: 'Sara', email: 'sara@example.com', age: 30 }));
    expect(err).toBeNull();
  });

  it('requires name and email', async () => {
    const err = await validationError(new User({}));
    expect(err.errors.name).toBeDefined();
    expect(err.errors.email).toBeDefined();
  });

  it('rejects an invalid email format', async () => {
    const err = await validationError(new User({ name: 'x', email: 'not-an-email' }));
    expect(err.errors.email).toBeDefined();
  });

  it('rejects a non-integer or out-of-range age', async () => {
    expect((await validationError(new User({ name: 'x', email: 'a@b.com', age: 1.5 }))).errors.age).toBeDefined();
    expect((await validationError(new User({ name: 'x', email: 'a@b.com', age: 200 }))).errors.age).toBeDefined();
  });

  it('normalizes email (trim + lowercase)', () => {
    const user = new User({ name: 'x', email: '  A@B.COM  ' });
    expect(user.email).toBe('a@b.com');
  });
});
