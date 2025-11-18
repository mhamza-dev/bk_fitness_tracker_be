import { Like, Post, Comment } from '../models/index.js';

// @route   POST /api/likes
// @desc    Like a post or comment
// @access  Private
export const likePostOrComment = async (req, res) => {
    try {
        const { postId, commentId } = req.body;

        if (!postId && !commentId) {
            return res.status(400).json({ msg: 'Please provide either postId or commentId' });
        }

        if (postId && commentId) {
            return res.status(400).json({ msg: 'Cannot like both post and comment simultaneously' });
        }

        // Check if already liked
        const existingLike = await Like.findOne({
            userId: req.user.id,
            ...(postId ? { postId } : { commentId })
        });

        if (existingLike) {
            return res.status(400).json({ msg: 'Already liked' });
        }

        // Verify post/comment exists
        if (postId) {
            const post = await Post.findById(postId);
            if (!post || post.isDeleted) {
                return res.status(404).json({ msg: 'Post not found' });
            }
            if (!post.isPublic && post.userId.toString() !== req.user.id) {
                return res.status(403).json({ msg: 'Access denied' });
            }
        } else {
            const comment = await Comment.findById(commentId);
            if (!comment || comment.isDeleted) {
                return res.status(404).json({ msg: 'Comment not found' });
            }
        }

        const like = new Like({
            userId: req.user.id,
            postId: postId || null,
            commentId: commentId || null
        });

        await like.save();

        // Update likes count
        if (postId) {
            await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });
        } else {
            await Comment.findByIdAndUpdate(commentId, { $inc: { likesCount: 1 } });
        }

        res.status(201).json({ msg: 'Liked successfully', like });
    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Already liked' });
        }
        res.status(500).send('Server error');
    }
};

// @route   DELETE /api/likes
// @desc    Unlike a post or comment
// @access  Private
export const unlikePostOrComment = async (req, res) => {
    try {
        const { postId, commentId } = req.query;

        if (!postId && !commentId) {
            return res.status(400).json({ msg: 'Please provide either postId or commentId' });
        }

        const like = await Like.findOneAndDelete({
            userId: req.user.id,
            ...(postId ? { postId } : { commentId })
        });

        if (!like) {
            return res.status(404).json({ msg: 'Like not found' });
        }

        // Update likes count
        if (postId) {
            await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });
        } else {
            await Comment.findByIdAndUpdate(commentId, { $inc: { likesCount: -1 } });
        }

        res.json({ msg: 'Unliked successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET /api/likes/post/:postId
// @desc    Get users who liked a post
// @access  Private
export const getPostLikes = async (req, res) => {
    try {
        const { postId } = req.params;
        const { limit = 50 } = req.query;

        // Check if post exists and is accessible
        const post = await Post.findById(postId);
        if (!post || post.isDeleted) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        if (!post.isPublic && post.userId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const likes = await Like.find({ postId })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json(likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

