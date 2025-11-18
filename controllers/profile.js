import { Profile } from '../models/index.js';

// @route   GET /api/profiles
// @desc    Get profile for the authenticated user
// @access  Private
export const getProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user.id })
            .populate('userId', 'name email');

        if (!profile) {
            return res.json(null);
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

// @route   POST /api/profiles/allergies
// @desc    Add an allergy to profile
// @access  Private
export const addAllergy = async (req, res) => {
    try {
        const { name, severity, notes } = req.body;

        if (!name) {
            return res.status(400).json({ msg: 'Please provide allergy name' });
        }

        let profile = await Profile.findOne({ userId: req.user.id });

        if (!profile) {
            return res.status(404).json({ msg: 'Profile not found. Create a profile first.' });
        }

        // Check if allergy already exists
        const existingAllergy = profile.allergies.find(a => a.name.toLowerCase() === name.toLowerCase());
        if (existingAllergy) {
            return res.status(400).json({ msg: 'Allergy already exists' });
        }

        profile.allergies.push({ name, severity: severity || 'moderate', notes });
        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   DELETE /api/profiles/allergies
// @desc    Remove an allergy from profile
// @access  Private
export const removeAllergy = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ msg: 'Please provide allergy name' });
        }

        const profile = await Profile.findOne({ userId: req.user.id });

        if (!profile) {
            return res.status(404).json({ msg: 'Profile not found' });
        }

        profile.allergies = profile.allergies.filter(a => a.name.toLowerCase() !== name.toLowerCase());
        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   POST /api/profiles/physical-issues
// @desc    Add a physical issue to profile
// @access  Private
export const addPhysicalIssue = async (req, res) => {
    try {
        const { name, type, notes } = req.body;

        if (!name) {
            return res.status(400).json({ msg: 'Please provide physical issue name' });
        }

        let profile = await Profile.findOne({ userId: req.user.id });

        if (!profile) {
            return res.status(404).json({ msg: 'Profile not found. Create a profile first.' });
        }

        // Check if issue already exists
        const existingIssue = profile.physicalIssues.find(i => i.name.toLowerCase() === name.toLowerCase());
        if (existingIssue) {
            return res.status(400).json({ msg: 'Physical issue already exists' });
        }

        profile.physicalIssues.push({ name, type: type || 'condition', notes });
        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   DELETE /api/profiles/physical-issues
// @desc    Remove a physical issue from profile
// @access  Private
export const removePhysicalIssue = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ msg: 'Please provide physical issue name' });
        }

        const profile = await Profile.findOne({ userId: req.user.id });

        if (!profile) {
            return res.status(404).json({ msg: 'Profile not found' });
        }

        profile.physicalIssues = profile.physicalIssues.filter(i => i.name.toLowerCase() !== name.toLowerCase());
        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   PUT /api/profiles/weight-height
// @desc    Update weight and height in profile
// @access  Private
export const updateWeightHeight = async (req, res) => {
    try {
        const { weight, height, weightUnit, heightUnit } = req.body;

        if (!weight || !height) {
            return res.status(400).json({ msg: 'Please provide weight and height' });
        }

        let profile = await Profile.findOne({ userId: req.user.id });

        if (!profile) {
            return res.status(404).json({ msg: 'Profile not found. Create a profile first.' });
        }

        if (weight !== undefined) profile.weight = weight;
        if (height !== undefined) profile.height = height;
        if (weightUnit !== undefined) profile.weightUnit = weightUnit;
        if (heightUnit !== undefined) profile.heightUnit = heightUnit;

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

