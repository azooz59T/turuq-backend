import { Router } from 'express';

const router = Router();

// Root — quick "is the API up?" check.
router.get('/', (_req, res) => {
  res.json({ name: 'turuq-backend', message: 'API is running' });
});

// Health/liveness probe (used by deploy platforms & uptime checks).
// Intentionally does NOT touch the database so it stays fast and dependency-free.
router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Feature routers are mounted here as they land in their own PRs, e.g.:
//   import userRoutes from './user.routes.js';
//   router.use('/users', userRoutes);

export default router;
