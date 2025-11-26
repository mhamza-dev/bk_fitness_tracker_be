import express from 'express';
const router = express.Router();
import { auth } from '../middleware/index.js';
import {
    getWeights,
    getWeightById,
    getLatestWeight,
    getWeightStats,
    getWeightProgress,
    createWeight,
    updateWeight,
    deleteWeight
} from '../controllers/index.js';

// All routes are protected with auth middleware
// Note: Order matters - specific routes must come before parameterized routes
router.get('/latest', auth, getLatestWeight);
router.get('/stats', auth, getWeightStats);
router.get('/progress', auth, getWeightProgress);
router.get('/', auth, getWeights);
router.get('/:id', auth, getWeightById);
router.post('/', auth, createWeight);
router.put('/:id', auth, updateWeight);
router.delete('/:id', auth, deleteWeight);

export default router;

