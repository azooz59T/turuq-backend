import { z } from 'zod';

// Reusable field schemas. Strings are trimmed (and email lowercased) so the
// data reaching the controller is already normalized.
const name = z
  .string({ error: 'Name is required' })
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name cannot exceed 100 characters');

const email = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .pipe(z.email('Please provide a valid email address'));

const age = z
  .number({ error: 'Age must be a number' })
  .int('Age must be an integer')
  .min(0, 'Age cannot be negative')
  .max(120, 'Age must be 120 or below');

// POST /users — name & email required, age optional.
// Unknown keys are stripped by default (defense against mass-assignment).
export const createUserSchema = z.object({
  name,
  email,
  age: age.optional(),
});

// PUT /users/:id — every field optional, but at least one must be present.
export const updateUserSchema = z
  .object({
    name: name.optional(),
    email: email.optional(),
    age: age.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field (name, email, or age) must be provided',
  });

// GET /users query params — pagination + optional age-range filtering.
// Query values arrive as strings, so coerce them to numbers.
const intParam = (label) =>
  z.coerce.number({ error: `${label} must be a number` }).int(`${label} must be an integer`);

export const listUsersQuerySchema = z
  .object({
    page: intParam('page').min(1, 'page must be at least 1').default(1),
    limit: intParam('limit')
      .min(1, 'limit must be at least 1')
      .max(100, 'limit cannot exceed 100')
      .default(10),
    minAge: intParam('minAge')
      .min(0, 'minAge cannot be negative')
      .max(120, 'minAge must be 120 or below')
      .optional(),
    maxAge: intParam('maxAge')
      .min(0, 'maxAge cannot be negative')
      .max(120, 'maxAge must be 120 or below')
      .optional(),
  })
  .refine((q) => q.minAge === undefined || q.maxAge === undefined || q.minAge <= q.maxAge, {
    message: 'minAge cannot be greater than maxAge',
    path: ['minAge'],
  });
