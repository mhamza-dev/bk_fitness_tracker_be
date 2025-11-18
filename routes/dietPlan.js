import express from 'express';
const router = express.Router();
import { auth } from '../middleware/index.js';
import {
    getDietPlans,
    getUserDietPlans,
    getDietPlanById,
    getActiveDietPlan,
    createDietPlan,
    updateDietPlan,
    deactivateDietPlan,
    generateDietPlanSuggestions,
    deleteDietPlan
} from '../controllers/index.js';

// All routes are protected with auth middleware
// Note: Order matters - specific routes must come before parameterized routes
router.get('/active', auth, getActiveDietPlan);
router.get('/user', auth, getUserDietPlans);
router.post('/generate-suggestions', auth, generateDietPlanSuggestions);
router.get('/', auth, getDietPlans);
router.get('/:id', auth, getDietPlanById);
router.post('/', auth, createDietPlan);
router.put('/:id/deactivate', auth, deactivateDietPlan);
router.put('/:id', auth, updateDietPlan);
router.delete('/:id', auth, deleteDietPlan);

export default router;

