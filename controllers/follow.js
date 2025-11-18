import { Follow, User } from '../models/index.js';

// @route   POST /api/follow/:userId
// @desc    Follow a user
// @access  Private
export const followUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (userId === req.user.id) {
            return res.status(400).json({ msg: 'Cannot follow yourself' });
        }

        // Check if user exists
        const userToFollow = await User.findById(userId);
        if (!userToFollow) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if already following
        const existingFollow = await Follow.findOne({
            followerId: req.user.id,
            followingId: userId
        });

        if (existingFollow) {
            return res.status(400).json({ msg: 'Already following this user' });
        }

        const follow = new Follow({
            followerId: req.user.id,
            followingId: userId
        });

        await follow.save();

        res.status(201).json({ msg: 'Successfully followed user', follow });
    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Already following this user' });
        }
        res.status(500).send('Server error');
    }
};

// @route   DELETE /api/follow/:userId
// @desc    Unfollow a user
// @access  Private
export const unfollowUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const follow = await Follow.findOneAndDelete({
            followerId: req.user.id,
            followingId: userId
        });

        if (!follow) {
            return res.status(404).json({ msg: 'Not following this user' });
        }

        res.json({ msg: 'Successfully unfollowed user' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET /api/follow/followers/:userId
// @desc    Get followers of a user
// @access  Private
export const getFollowers = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50 } = req.query;

        const follows = await Follow.find({ followingId: userId })
            .populate('followerId', 'name email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        const followers = follows.map(f => f.followerId);

        res.json(followers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET /api/follow/following/:userId
// @desc    Get users that a user is following
// @access  Private
export const getFollowing = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50 } = req.query;

        const follows = await Follow.find({ followerId: userId })
            .populate('followingId', 'name email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        const following = follows.map(f => f.followingId);

        res.json(following);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET /api/follow/status/:userId
// @desc    Check if current user follows a specific user
// @access  Private
export const getFollowStatus = async (req, res) => {
    try {
        const { userId } = req.params;

        const follow = await Follow.findOne({
            followerId: req.user.id,
            followingId: userId
        });

        res.json({
            isFollowing: !!follow,
            isOwnProfile: userId === req.user.id
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

