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

router
  .route('/')
  .post(validate(createUserSchema), userController.createUser) // POST   /users
  .get(validate(listUsersQuerySchema, 'query'), userController.getUsers); //  GET /users

router
  .route('/:id')
  .get(userController.getUserById) //                              GET    /users/:id
  .put(validate(updateUserSchema), userController.updateUser) //   PUT    /users/:id
  .delete(userController.deleteUser); //                          DELETE /users/:id

export default router;
