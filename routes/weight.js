import express from 'express';
const router = express.Router();
import { auth } from '../middleware/index.js';
import {
    getWeights,
    getWeightById,
    getLatestWeight,
    createWeight,
    updateWeight,
    deleteWeight
} from '../controllers/index.js';

// All routes are protected with auth middleware
router.get('/latest', auth, getLatestWeight);
router.get('/', auth, getWeights);
router.get('/:id', auth, getWeightById);
router.post('/', auth, createWeight);
router.put('/:id', auth, updateWeight);
router.delete('/:id', auth, deleteWeight);

export default router;

