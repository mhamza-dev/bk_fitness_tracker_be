import express from 'express';
const router = express.Router();
import { auth } from '../middleware/auth.js';
import {
    getDietPlans,
    getDietPlanById,
    createDietPlan,
    updateDietPlan,
    deleteDietPlan
} from '../controllers/dietPlan.js';

// All routes are protected with auth middleware
router.get('/', auth, getDietPlans);
router.get('/:id', auth, getDietPlanById);
router.post('/', auth, createDietPlan);
router.put('/:id', auth, updateDietPlan);
router.delete('/:id', auth, deleteDietPlan);

export default router;

