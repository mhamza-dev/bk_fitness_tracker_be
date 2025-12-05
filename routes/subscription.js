import express from 'express';
const router = express.Router();
import { auth } from '../middleware/index.js';
import {
    getSubscription,
    getPlans,
    purchaseSubscription,
    cancelSubscription
} from '../controllers/index.js';

// All routes are protected with auth middleware
router.get('/current', auth, getSubscription);
router.get('/plans', auth, getPlans);
router.post('/purchase', auth, purchaseSubscription);
router.post('/cancel', auth, cancelSubscription);

export default router;

