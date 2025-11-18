import { Comment, Like, Post } from '../models/index.js';

// @route   GET /api/comments/post/:postId
// @desc    Get all comments for a post
// @access  Private
export const getPostComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const { limit = 50, page = 1 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Check if post exists and is accessible
        const post = await Post.findById(postId);
        if (!post || post.isDeleted) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        if (!post.isPublic && post.userId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const comments = await Comment.find({
            postId,
            isDeleted: false,
            parentCommentId: null // Only top-level comments
        })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get like status for comments
        const commentIds = comments.map(c => c._id);
        const userLikes = await Like.find({
            userId: req.user.id,
            commentId: { $in: commentIds }
        });

        const likedCommentIds = new Set(userLikes.map(l => l.commentId.toString()));

        const commentsWithLikes = comments.map(comment => ({
            ...comment.toObject(),
            isLiked: likedCommentIds.has(comment._id.toString())
        }));

        const total = await Comment.countDocuments({
            postId,
            isDeleted: false,
            parentCommentId: null
        });

        res.json({
            comments: commentsWithLikes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET /api/comments/:id/replies
// @desc    Get replies to a comment
// @access  Private
export const getCommentReplies = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 20 } = req.query;

        const replies = await Comment.find({
            parentCommentId: id,
            isDeleted: false
        })
            .populate('userId', 'name email')
            .sort({ createdAt: 1 })
            .limit(parseInt(limit));

        // Get like status
        const commentIds = replies.map(c => c._id);
        const userLikes = await Like.find({
            userId: req.user.id,
            commentId: { $in: commentIds }
        });

        const likedCommentIds = new Set(userLikes.map(l => l.commentId.toString()));

        const repliesWithLikes = replies.map(reply => ({
            ...reply.toObject(),
            isLiked: likedCommentIds.has(reply._id.toString())
        }));

        res.json(repliesWithLikes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   POST /api/comments
// @desc    Create a new comment
// @access  Private
export const createComment = async (req, res) => {
    try {
        const { postId, text, parentCommentId } = req.body;

        if (!postId || !text) {
            return res.status(400).json({ msg: 'Please provide postId and text' });
        }

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post || post.isDeleted) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        if (!post.isPublic && post.userId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const comment = new Comment({
            postId,
            userId: req.user.id,
            text,
            parentCommentId: parentCommentId || null
        });

        await comment.save();
        
        // Update post comments count
        await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

        await comment.populate('userId', 'name email');

        res.status(201).json(comment);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error');
    }
};

// @route   PUT /api/comments/:id
// @desc    Update a comment
// @access  Private
export const updateComment = async (req, res) => {
    try {
        const { text } = req.body;

        const comment = await Comment.findOne({
            _id: req.params.id,
            userId: req.user.id,
            isDeleted: false
        });

        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        if (text !== undefined) comment.text = text;

        await comment.save();
        await comment.populate('userId', 'name email');

        res.json(comment);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Comment not found' });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error');
    }
};

// @route   DELETE /api/comments/:id
// @desc    Delete a comment (soft delete)
// @access  Private
export const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        comment.isDeleted = true;
        await comment.save();

        // Update post comments count
        await Post.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } });

        res.json({ msg: 'Comment deleted successfully' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Comment not found' });
        }
        res.status(500).send('Server error');
    }
};

