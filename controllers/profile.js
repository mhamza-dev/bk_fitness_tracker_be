import { Profile } from '../models/index.js';

// @route   GET /api/profiles
// @desc    Get profile for the authenticated user
// @access  Private
export const getProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user.id })
            .populate('userId', 'name email');

        if (!profile) {
            return res.status(404).json({ msg: 'Profile not found' });
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   POST /api/profiles
// @desc    Create a new profile
// @access  Private
export const createProfile = async (req, res) => {
    try {
        // Check if profile already exists
        const existingProfile = await Profile.findOne({ userId: req.user.id });
        if (existingProfile) {
            return res.status(400).json({ msg: 'Profile already exists. Use PUT to update instead.' });
        }

        const {
            dateOfBirth,
            gender,
            weight,
            height,
            weightUnit,
            heightUnit,
            allergies,
            physicalIssues,
            activityLevel,
            dietaryPreferences,
            healthGoals
        } = req.body;

        // Validate required fields
        if (!dateOfBirth || !weight || !height) {
            return res.status(400).json({ msg: 'Please provide dateOfBirth, weight, and height' });
        }

        const profile = new Profile({
            userId: req.user.id,
            dateOfBirth,
            gender,
            weight,
            height,
            weightUnit: weightUnit || 'kg',
            heightUnit: heightUnit || 'cm',
            allergies: allergies || [],
            physicalIssues: physicalIssues || [],
            activityLevel: activityLevel || 'moderately_active',
            dietaryPreferences: dietaryPreferences || [],
            healthGoals: healthGoals || []
        });

        await profile.save();
        await profile.populate('userId', 'name email');

        res.status(201).json(profile);
    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Profile already exists for this user' });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error');
    }
};

// @route   PUT /api/profiles
// @desc    Update user profile
// @access  Private
export const updateProfile = async (req, res) => {
    try {
        const {
            dateOfBirth,
            gender,
            weight,
            height,
            weightUnit,
            heightUnit,
            allergies,
            physicalIssues,
            activityLevel,
            dietaryPreferences,
            healthGoals
        } = req.body;

        let profile = await Profile.findOne({ userId: req.user.id });

        if (!profile) {
            return res.status(404).json({ msg: 'Profile not found. Create a profile first.' });
        }

        // Update fields
        if (dateOfBirth !== undefined) profile.dateOfBirth = dateOfBirth;
        if (gender !== undefined) profile.gender = gender;
        if (weight !== undefined) profile.weight = weight;
        if (height !== undefined) profile.height = height;
        if (weightUnit !== undefined) profile.weightUnit = weightUnit;
        if (heightUnit !== undefined) profile.heightUnit = heightUnit;
        if (allergies !== undefined) profile.allergies = allergies;
        if (physicalIssues !== undefined) profile.physicalIssues = physicalIssues;
        if (activityLevel !== undefined) profile.activityLevel = activityLevel;
        if (dietaryPreferences !== undefined) profile.dietaryPreferences = dietaryPreferences;
        if (healthGoals !== undefined) profile.healthGoals = healthGoals;

        await profile.save();
        await profile.populate('userId', 'name email');

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error');
    }
};

// @route   DELETE /api/profiles
// @desc    Delete user profile
// @access  Private
export const deleteProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user.id });

        if (!profile) {
            return res.status(404).json({ msg: 'Profile not found' });
        }

        await profile.deleteOne();
        res.json({ msg: 'Profile removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

