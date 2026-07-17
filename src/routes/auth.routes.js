import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import validate from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/auth.validation.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register); // POST /auth/register
router.post('/login', validate(loginSchema), authController.login); //          POST /auth/login

export default router;
