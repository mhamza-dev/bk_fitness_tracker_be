import express from 'express';
const router = express.Router();
import { register, login, resetPassword, getMeUser } from '../controllers/index.js';

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.post('/me', auth, getMeUser);

export default router;
