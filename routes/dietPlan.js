import express from 'express';
const router = express.Router();
import { auth } from '../middleware/index.js';
import {
    getDietPlans,
    getDietPlanById,
    createDietPlan,
    updateDietPlan,
    deleteDietPlan
} from '../controllers/index.js';

// All routes are protected with auth middleware
router.get('/', auth, getDietPlans);
router.get('/:id', auth, getDietPlanById);
router.post('/', auth, createDietPlan);
router.put('/:id', auth, updateDietPlan);
router.delete('/:id', auth, deleteDietPlan);

export default router;

