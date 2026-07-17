import { beforeAll, afterEach, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

beforeAll(async () => {
  // Spin up a throwaway in-memory MongoDB and point Mongoose at it, so tests
  // never touch the real Atlas database and stay fully isolated.
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // Build indexes (e.g. the unique email index) so uniqueness is enforced in tests.
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
});

afterEach(async () => {
  // Wipe every collection between tests for a clean slate.
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
