import express from 'express';
const router = express.Router();
import { auth } from '../middleware/index.js';
import {
    getFeed,
    getUserPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost
} from '../controllers/index.js';

// All routes are protected with auth middleware
router.get('/feed', auth, getFeed);
router.get('/user/:userId', auth, getUserPosts);
router.get('/:id', auth, getPostById);
router.post('/', auth, createPost);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);

export default router;

