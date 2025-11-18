import express from 'express';
const router = express.Router();
import { auth } from '../middleware/auth.js';
import {
    getFitnessData,
    getFitnessDataById,
    getFitnessDataByDate,
    createFitnessData,
    updateFitnessData,
    upsertFitnessDataByDate,
    deleteFitnessData
} from '../controllers/fitnessData.js';

// All routes are protected with auth middleware
router.get('/', auth, getFitnessData);
router.get('/date/:date', auth, getFitnessDataByDate);
router.get('/:id', auth, getFitnessDataById);
router.post('/', auth, createFitnessData);
router.put('/date/:date', auth, upsertFitnessDataByDate);
router.put('/:id', auth, updateFitnessData);
router.delete('/:id', auth, deleteFitnessData);

export default router;

