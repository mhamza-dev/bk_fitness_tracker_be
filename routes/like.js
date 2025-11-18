import express from 'express';
const router = express.Router();
import { auth } from '../middleware/index.js';
import {
    likePostOrComment,
    unlikePostOrComment,
    getPostLikes
} from '../controllers/index.js';

// All routes are protected with auth middleware
router.get('/post/:postId', auth, getPostLikes);
router.post('/', auth, likePostOrComment);
router.delete('/', auth, unlikePostOrComment);

export default router;

