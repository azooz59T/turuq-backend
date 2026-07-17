import * as userService from '../services/user.service.js';

/**
 * Controllers stay thin: read the request, call the service, shape the response.
 * Async errors bubble up to the central error handler — Express 5 forwards
 * rejected promises from async handlers automatically, so no try/catch needed.
 */

// POST /users
export async function createUser(req, res) {
  const user = await userService.createUser(req.body);
  res.status(201).json({ success: true, data: user });
}

// GET /users
export async function getUsers(req, res) {
  const users = await userService.getUsers();
  res.status(200).json({ success: true, count: users.length, data: users });
}

// GET /users/:id
export async function getUserById(req, res) {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json({ success: true, data: user });
}

// PUT /users/:id
export async function updateUser(req, res) {
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(200).json({ success: true, data: user });
}

// DELETE /users/:id
export async function deleteUser(req, res) {
  await userService.deleteUser(req.params.id);
  res.status(200).json({ success: true, message: 'User deleted successfully' });
}
