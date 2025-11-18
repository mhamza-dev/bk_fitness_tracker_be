import express from 'express';
const router = express.Router();
import { auth } from '../middleware/index.js';
import {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getFollowStatus
} from '../controllers/index.js';

// All routes are protected with auth middleware
router.get('/status/:userId', auth, getFollowStatus);
router.get('/followers/:userId', auth, getFollowers);
router.get('/following/:userId', auth, getFollowing);
router.post('/:userId', auth, followUser);
router.delete('/:userId', auth, unfollowUser);

export default router;

