import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { isProd, isTest } from './config/env.js';
import routes from './routes/index.js';
import swaggerSpec from './config/swagger.js';
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

// ── API documentation (Swagger UI) ─────────────────────────────────────────
// Serve the raw spec (importable into Insomnia/Postman) and the interactive UI.
// Helmet's default CSP blocks Swagger UI's inline assets, so relax it here only.
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));
app.use(
  '/api-docs',
  (_req, res, next) => {
    res.removeHeader('Content-Security-Policy');
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Turuq API Docs' })
);

// ── 404 + centralized error handling (must be registered last) ─────────────
app.use(notFound);
app.use(errorHandler);

export default app;
