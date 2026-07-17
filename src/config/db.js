import mongoose from 'mongoose';
import env from './env.js';

/**
 * Establish a connection to MongoDB via Mongoose.
 *
 * The API is useless without its datastore, so the caller (server.js) treats a
 * failure here as fatal and exits — "fail fast" rather than serving a broken API.
 *
 * @returns {Promise<import('mongoose').Connection>} the active connection
 */
export async function connectDB() {
  if (!env.mongoUri) {
    throw new Error(
      'MONGODB_URI is not set. Add it to your .env file (see .env.example).'
    );
  }

  // Surface connection lifecycle events for observability/debugging.
  mongoose.connection.on('connected', () => console.log('✅ MongoDB connected'));
  mongoose.connection.on('error', (err) =>
    console.error('❌ MongoDB connection error:', err.message)
  );
  mongoose.connection.on('disconnected', () =>
    console.warn('⚠️  MongoDB disconnected')
  );

  // Reject queries that reference fields not in the schema (defensive default).
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.mongoUri);
  return mongoose.connection;
}

/** Close the MongoDB connection (used during graceful shutdown and in tests). */
export async function disconnectDB() {
  await mongoose.connection.close();
}
