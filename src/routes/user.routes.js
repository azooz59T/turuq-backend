import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import validate from '../middleware/validate.js';
import requireAuth from '../middleware/auth.js';
import {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
} from '../validators/user.validation.js';

const router = Router();

// All user-profile endpoints require a valid JWT.
router.use(requireAuth);

/**
 * @openapi
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Create a user profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UserInput' }
 *     responses:
 *       '201':
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/User' }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *       '409': { $ref: '#/components/responses/Conflict' }
 *   get:
 *     tags: [Users]
 *     summary: List user profiles (paginated, optional age filter)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page,   schema: { type: integer, default: 1, minimum: 1 } }
 *       - { in: query, name: limit,  schema: { type: integer, default: 10, minimum: 1, maximum: 100 } }
 *       - { in: query, name: minAge, schema: { type: integer, minimum: 0, maximum: 120 } }
 *       - { in: query, name: maxAge, schema: { type: integer, minimum: 0, maximum: 120 } }
 *     responses:
 *       '200':
 *         description: A page of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 count: { type: integer, example: 2 }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total: { type: integer, example: 42 }
 *                     page: { type: integer, example: 1 }
 *                     limit: { type: integer, example: 10 }
 *                     totalPages: { type: integer, example: 5 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/User' }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 */
router
  .route('/')
  .post(validate(createUserSchema), userController.createUser)
  .get(validate(listUsersQuerySchema, 'query'), userController.getUsers);

/**
 * @openapi
 * /users/{id}:
 *   parameters:
 *     - { in: path, name: id, required: true, schema: { type: string }, description: User id }
 *   get:
 *     tags: [Users]
 *     summary: Fetch a user by id
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200':
 *         description: The user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/User' }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Users]
 *     summary: Update a user (name, email and/or age)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UserInput' }
 *     responses:
 *       '200':
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/User' }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *       '409': { $ref: '#/components/responses/Conflict' }
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user by id
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200':
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: User deleted successfully }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
router
  .route('/:id')
  .get(userController.getUserById)
  .put(validate(updateUserSchema), userController.updateUser)
  .delete(userController.deleteUser);

export default router;
