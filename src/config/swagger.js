import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerJSDoc from 'swagger-jsdoc';
import env from './env.js';

const here = path.dirname(fileURLToPath(import.meta.url));

// Prefer the deployed URL (set API_PUBLIC_URL in production) so Swagger UI's
// "Try it out" targets the live server; always keep localhost for local dev.
const servers = [];
if (env.publicUrl) servers.push({ url: env.publicUrl, description: 'Production' });
servers.push({ url: `http://localhost:${env.port}`, description: 'Local development' });

/**
 * Base OpenAPI document. Reusable pieces (schemas, security scheme, common error
 * responses) live here; the per-endpoint operations are declared as `@openapi`
 * JSDoc annotations in the route files and merged in by swagger-jsdoc.
 */
const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Turuq Backend API',
    version: '1.0.0',
    description:
      'RESTful API for managing user profiles with JWT authentication. ' +
      'Register or log in via `/auth` to obtain a token, then send it as a ' +
      '`Bearer` token to the protected `/users` endpoints.',
  },
  servers,
  tags: [
    { name: 'Auth', description: 'Registration and login' },
    { name: 'Users', description: 'User profile CRUD (JWT-protected)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '665f0c2a1b2c3d4e5f6a7b8c' },
          name: { type: 'string', example: 'Sara' },
          email: { type: 'string', format: 'email', example: 'sara@example.com' },
          age: { type: 'integer', example: 30 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      UserInput: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string', example: 'Sara' },
          email: { type: 'string', format: 'email', example: 'sara@example.com' },
          age: { type: 'integer', minimum: 0, maximum: 120, example: 30 },
        },
      },
      Account: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '665f0c2a1b2c3d4e5f6a7b8c' },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Credentials: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', format: 'password', minLength: 8, example: 'password123' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          details: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Invalid input',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Unauthorized: {
        description: 'Missing or invalid token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Conflict: {
        description: 'Duplicate resource (e.g. email already exists)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
};

const swaggerSpec = swaggerJSDoc({
  definition,
  // Absolute glob so the scan works regardless of the process working directory.
  // Force forward slashes — the underlying glob matcher fails on Windows backslashes.
  apis: [path.join(here, '../routes/*.js').replace(/\\/g, '/')],
});

export default swaggerSpec;
