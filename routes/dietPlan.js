import express from 'express';
const router = express.Router();
import { auth } from '../middleware/index.js';
import {
    getTodayDietPlan,
    getDietPlanByDate,
    getDietPlans,
    generateTodayDietPlan,
    updateDietPlan,
    deleteDietPlan
} from '../controllers/index.js';

// All routes are protected with auth middleware
// Note: Order matters - specific routes must come before parameterized routes
router.get('/today', auth, getTodayDietPlan);
router.post('/generate', auth, generateTodayDietPlan);
router.get('/date/:date', auth, getDietPlanByDate);
router.get('/', auth, getDietPlans);
router.put('/:id', auth, updateDietPlan);
router.delete('/:id', auth, deleteDietPlan);

export default router;
