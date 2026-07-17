import * as authService from '../services/auth.service.js';

// POST /auth/register
export async function register(req, res) {
  const { account, token } = await authService.register(req.body);
  res.status(201).json({ success: true, data: { account, token } });
}

// POST /auth/login
export async function login(req, res) {
  const { account, token } = await authService.login(req.body);
  res.status(200).json({ success: true, data: { account, token } });
}
