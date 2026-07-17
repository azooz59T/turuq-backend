import Account from '../models/account.model.js';
import ApiError from '../utils/ApiError.js';
import { signToken } from '../utils/jwt.js';

/** Register a new account and return it along with a freshly signed JWT. */
export async function register({ email, password }) {
  const account = await Account.create({ email, password });
  const token = signToken({ sub: account.id, email: account.email });
  return { account, token };
}

/** Verify credentials and return the account + a JWT, or 401. */
export async function login({ email, password }) {
  // `password` is select:false on the schema, so request it explicitly.
  const account = await Account.findOne({ email }).select('+password');

  // Same error for "no such account" and "wrong password" — avoids leaking
  // which emails are registered (user-enumeration protection).
  if (!account || !(await account.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = signToken({ sub: account.id, email: account.email });
  return { account, token };
}
