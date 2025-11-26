import express from 'express';
const router = express.Router();
import { auth } from '../middleware/index.js';
import {
    getNotificationPreferences,
    createNotificationPreferences,
    updateNotificationPreferences,
    deleteNotificationPreferences
} from '../controllers/index.js';

// All routes are protected with auth middleware
router.get('/', auth, getNotificationPreferences);
router.post('/', auth, createNotificationPreferences);
router.put('/', auth, updateNotificationPreferences);
router.delete('/', auth, deleteNotificationPreferences);

export default router;


