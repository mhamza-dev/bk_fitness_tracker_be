import express from 'express';
const router = express.Router();
import { auth } from '../middleware/index.js';
import {
    getFitnessData,
    getFitnessDataById,
    getFitnessDataByDate,
    getFitnessDataRange,
    getFitnessStats,
    createFitnessData,
    updateFitnessData,
    upsertFitnessDataByDate,
    updateSteps,
    addWorkout,
    updateWaterIntake,
    updateSleep,
    deleteFitnessData
} from '../controllers/index.js';

// All routes are protected with auth middleware
// Note: Order matters - specific routes must come before parameterized routes
router.get('/range', auth, getFitnessDataRange);
router.get('/stats', auth, getFitnessStats);
router.get('/date/:date', auth, getFitnessDataByDate);
router.get('/', auth, getFitnessData);
router.get('/:id', auth, getFitnessDataById);
router.post('/workouts', auth, addWorkout);
router.post('/', auth, createFitnessData);
router.put('/sleep', auth, updateSleep);
router.put('/water', auth, updateWaterIntake);
router.put('/steps', auth, updateSteps);
router.put('/date/:date', auth, upsertFitnessDataByDate);
router.put('/:id', auth, updateFitnessData);
router.delete('/:id', auth, deleteFitnessData);

export default router;

