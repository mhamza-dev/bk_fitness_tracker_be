import express from 'express';
const router = express.Router();
import { auth } from '../middleware/index.js';
import {
    getMeals,
    getMealById,
    getMealsByDate,
    getDailyNutrition,
    getNutritionSummary,
    createMeal,
    updateMeal,
    deleteMeal
} from '../controllers/index.js';

// All routes are protected with auth middleware
router.get('/nutrition-summary', auth, getNutritionSummary);
router.get('/nutrition/:date', auth, getDailyNutrition);
router.get('/date/:date', auth, getMealsByDate);
router.get('/', auth, getMeals);
router.get('/:id', auth, getMealById);
router.post('/', auth, createMeal);
router.put('/:id', auth, updateMeal);
router.delete('/:id', auth, deleteMeal);

export default router;

