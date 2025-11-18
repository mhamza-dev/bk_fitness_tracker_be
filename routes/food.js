import express from 'express';
const router = express.Router();
import { auth } from '../middleware/index.js';
import {
    getFoods,
    getFoodById,
    createFood,
    updateFood,
    deleteFood,
    searchFoods
} from '../controllers/index.js';

// All routes are protected with auth middleware
router.get('/search/:query', auth, searchFoods);
router.get('/', auth, getFoods);
router.get('/:id', auth, getFoodById);
router.post('/', auth, createFood);
router.put('/:id', auth, updateFood);
router.delete('/:id', auth, deleteFood);

export default router;

