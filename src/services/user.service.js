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

/** List user profiles (pagination & age filtering are added in a later PR). */
export function getUsers() {
  return User.find().sort({ createdAt: -1 });
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
