import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';

const router = Router();

router
  .route('/')
  .post(userController.createUser) // POST   /users
  .get(userController.getUsers); //   GET    /users

router
  .route('/:id')
  .get(userController.getUserById) //   GET    /users/:id
  .put(userController.updateUser) //    PUT    /users/:id
  .delete(userController.deleteUser); // DELETE /users/:id

export default router;
