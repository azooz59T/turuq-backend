import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import validate from '../middleware/validate.js';
import { createUserSchema, updateUserSchema } from '../validators/user.validation.js';

const router = Router();

router
  .route('/')
  .post(validate(createUserSchema), userController.createUser) // POST   /users
  .get(userController.getUsers); //                               GET    /users

router
  .route('/:id')
  .get(userController.getUserById) //                              GET    /users/:id
  .put(validate(updateUserSchema), userController.updateUser) //   PUT    /users/:id
  .delete(userController.deleteUser); //                          DELETE /users/:id

export default router;
