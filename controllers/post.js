import { Post, Like, Comment, Follow } from '../models/index.js';

// @route   GET /api/posts
// @desc    Get posts feed (posts from followed users + own posts)
// @access  Private
export const getFeed = async (req, res) => {
    try {
        const { limit = 20, page = 1 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get list of users the current user follows
        const following = await Follow.find({ followerId: req.user.id })
            .select('followingId');
        const followingIds = following.map(f => f.followingId);
        
        // Include current user's own posts
        followingIds.push(req.user.id);

        // Get posts from followed users and self
        const posts = await Post.find({
            userId: { $in: followingIds },
            isPublic: true,
            isDeleted: false
        })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get like status for each post
        const postIds = posts.map(p => p._id);
        const userLikes = await Like.find({
            userId: req.user.id,
            postId: { $in: postIds }
        });

        const likedPostIds = new Set(userLikes.map(l => l.postId.toString()));

        // Add like status to posts
        const postsWithLikes = posts.map(post => ({
            ...post.toObject(),
            isLiked: likedPostIds.has(post._id.toString())
        }));

        const total = await Post.countDocuments({
            userId: { $in: followingIds },
            isPublic: true,
            isDeleted: false
        });

        res.json({
            posts: postsWithLikes,
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

// @route   GET /api/posts/user/:userId
// @desc    Get posts by a specific user
// @access  Private
export const getUserPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, page = 1 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = {
            userId,
            isDeleted: false
        };

        // If viewing own posts, show all. Otherwise, only public posts
        if (userId !== req.user.id) {
            query.isPublic = true;
        }

        const posts = await Post.find(query)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get like status
        const postIds = posts.map(p => p._id);
        const userLikes = await Like.find({
            userId: req.user.id,
            postId: { $in: postIds }
        });

        const likedPostIds = new Set(userLikes.map(l => l.postId.toString()));

        const postsWithLikes = posts.map(post => ({
            ...post.toObject(),
            isLiked: likedPostIds.has(post._id.toString())
        }));

        const total = await Post.countDocuments(query);

        res.json({
            posts: postsWithLikes,
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

// @route   GET /api/posts/:id
// @desc    Get a specific post by ID
// @access  Private
export const getPostById = async (req, res) => {
    try {
        const post = await Post.findOne({
            _id: req.params.id,
            isDeleted: false
        })
            .populate('userId', 'name email')
            .populate('relatedWorkoutId')
            .populate('relatedMealId');

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check if user can view this post
        if (!post.isPublic && post.userId._id.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        // Check if user liked this post
        const like = await Like.findOne({
            userId: req.user.id,
            postId: post._id
        });

        res.json({
            ...post.toObject(),
            isLiked: !!like
        });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server error');
    }
};

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
export const createPost = async (req, res) => {
    try {
        const {
            caption,
            images,
            location,
            tags,
            postType,
            relatedWorkoutId,
            relatedMealId,
            isPublic
        } = req.body;

        // Validate that at least one image is provided
        if (!images || images.length === 0) {
            return res.status(400).json({ msg: 'At least one image is required' });
        }

        const post = new Post({
            userId: req.user.id,
            caption,
            images: Array.isArray(images) ? images : [images],
            location,
            tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
            postType: postType || 'general',
            relatedWorkoutId,
            relatedMealId,
            isPublic: isPublic !== undefined ? isPublic : true
        });

        await post.save();
        await post.populate('userId', 'name email');

        res.status(201).json(post);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error');
    }
};

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private
export const updatePost = async (req, res) => {
    try {
        const {
            caption,
            images,
            location,
            tags,
            isPublic
        } = req.body;

        const post = await Post.findOne({
            _id: req.params.id,
            userId: req.user.id,
            isDeleted: false
        });

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Update fields
        if (caption !== undefined) post.caption = caption;
        if (images !== undefined) post.images = Array.isArray(images) ? images : [images];
        if (location !== undefined) post.location = location;
        if (tags !== undefined) post.tags = Array.isArray(tags) ? tags : (tags ? [tags] : []);
        if (isPublic !== undefined) post.isPublic = isPublic;

        await post.save();
        await post.populate('userId', 'name email');

        res.json(post);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error');
    }
};

// @route   DELETE /api/posts/:id
// @desc    Delete a post (soft delete)
// @access  Private
export const deletePost = async (req, res) => {
    try {
        const post = await Post.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        post.isDeleted = true;
        await post.save();

        res.json({ msg: 'Post deleted successfully' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server error');
    }
};

