import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { isProd, isTest } from './config/env.js';
import routes from './routes/index.js';
import sanitize from './middleware/sanitize.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

/**
 * Builds and configures the Express application.
 *
 * Kept separate from server.js (which owns process concerns like DB connection
 * and `listen`) so the app can be imported directly by integration tests.
 */
const app = express();

// ── Security & body parsing ────────────────────────────────────────────────
app.use(helmet()); // sensible, secure-by-default HTTP headers
app.use(cors()); // allow cross-origin requests (tighten origins in prod)
app.use(express.json({ limit: '10kb' })); // parse JSON bodies, bounded to limit abuse
app.use(express.urlencoded({ extended: true }));
app.use(sanitize); // strip NoSQL-operator keys from request bodies

// ── Request logging (quiet during tests) ───────────────────────────────────
if (!isTest) {
  app.use(morgan(isProd ? 'combined' : 'dev'));
}

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/', routes);

// ── 404 + centralized error handling (must be registered last) ─────────────
app.use(notFound);
app.use(errorHandler);

export default app;
