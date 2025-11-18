import express from 'express';
const router = express.Router();
import { auth } from '../middleware/index.js';
import {
    getPostComments,
    getCommentReplies,
    createComment,
    updateComment,
    deleteComment
} from '../controllers/index.js';

// All routes are protected with auth middleware
router.get('/post/:postId', auth, getPostComments);
router.get('/:id/replies', auth, getCommentReplies);
router.post('/', auth, createComment);
router.put('/:id', auth, updateComment);
router.delete('/:id', auth, deleteComment);

export default router;

