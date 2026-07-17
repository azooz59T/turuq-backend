import dotenv from 'dotenv';

// Load variables from `.env` into process.env (no-op if the file is absent).
dotenv.config();

/**
 * Centralized, typed view of the environment configuration.
 * Everything that reads process.env should go through this module so that
 * configuration lives in exactly one place and is easy to validate/test.
 */
const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number.parseInt(process.env.PORT ?? '5000', 10),
  mongoUri: process.env.MONGODB_URI ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
};

export const isProd = env.nodeEnv === 'production';
export const isTest = env.nodeEnv === 'test';

export default env;
