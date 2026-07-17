import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';

// Only these fields may be set/updated by clients (mass-assignment protection —
// prevents a client from writing to `_id`, `createdAt`, etc.).
const ALLOWED_FIELDS = ['name', 'email', 'age'];

function pickAllowed(body = {}) {
  return ALLOWED_FIELDS.reduce((acc, key) => {
    if (body[key] !== undefined) acc[key] = body[key];
    return acc;
  }, {});
}

/** Create a new user profile. */
export function createUser(payload) {
  return User.create(pickAllowed(payload));
}

/**
 * List user profiles with pagination and optional age-range filtering.
 * Uses `.lean()` for a fast read and runs the count in parallel with the query.
 */
export async function getUsers({ page = 1, limit = 10, minAge, maxAge } = {}) {
  const filter = {};
  if (minAge !== undefined || maxAge !== undefined) {
    filter.age = {};
    if (minAge !== undefined) filter.age.$gte = minAge;
    if (maxAge !== undefined) filter.age.$lte = maxAge;
  }

  const skip = (page - 1) * limit;

  const [total, docs] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  // `.lean()` returns plain objects, so the model's toJSON transform doesn't run.
  // Normalize to the same shape used elsewhere (`id`, no `_id`/`__v`).
  const users = docs.map(({ _id, __v, ...rest }) => ({ id: _id, ...rest }));

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** Fetch a single user by id, or 404 if none exists. */
export async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

/** Update the allowed fields of a user, or 404 if none exists. */
export async function updateUser(id, payload) {
  const user = await User.findByIdAndUpdate(id, pickAllowed(payload), {
    returnDocument: 'after', // return the modified doc (replaces the deprecated `new: true`)
    runValidators: true, // enforce schema rules (email format, age range) on update
  });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

/** Delete a user by id, or 404 if none exists. */
export async function deleteUser(id) {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}
