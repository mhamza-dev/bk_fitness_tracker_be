import express from 'express';
const router = express.Router();
import { auth } from '../middleware/index.js';
import { register, login, resetPassword, getMeUser, changePassword } from '../controllers/index.js';

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.get('/me', auth, getMeUser);
router.post('/change-password', auth, changePassword);

export default router;
