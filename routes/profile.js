import express from 'express';
const router = express.Router();
import { auth } from '../middleware/index.js';
import {
    getProfile,
    createProfile,
    updateProfile,
    deleteProfile
} from '../controllers/index.js';

// All routes are protected with auth middleware
router.get('/', auth, getProfile);
router.post('/', auth, createProfile);
router.put('/', auth, updateProfile);
router.delete('/', auth, deleteProfile);

export default router;

