import app from './app.js';
import env from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

/**
 * Application entry point.
 * Connects to MongoDB first (fail fast), then starts the HTTP server and wires
 * up graceful shutdown so in-flight requests finish and the DB closes cleanly.
 */
async function start() {
  try {
    await connectDB();

    const server = app.listen(env.port, () => {
      console.log(
        `🚀 Server listening on http://localhost:${env.port} [${env.nodeEnv}]`
      );
    });

    const shutdown = (signal) => {
      console.log(`\n${signal} received — shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log('👋 Closed out remaining connections. Bye.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
