import { DietPlan } from '../models/index.js';

// @route   GET /api/diet-plans
// @desc    Get all diet plans for the authenticated user
// @access  Private
export const getDietPlans = async (req, res) => {
    try {
        const dietPlans = await DietPlan.find({ userId: req.user.id })
            .populate('userId', 'name email')
            .populate('profileId')
            .sort({ startDate: -1 });

        res.json(dietPlans);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET /api/diet-plans/:id
// @desc    Get a specific diet plan by ID
// @access  Private
export const getDietPlanById = async (req, res) => {
    try {
        const dietPlan = await DietPlan.findOne({
            _id: req.params.id,
            userId: req.user.id
        })
            .populate('userId', 'name email')
            .populate('profileId');

        if (!dietPlan) {
            return res.status(404).json({ msg: 'Diet plan not found' });
        }

        res.json(dietPlan);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Diet plan not found' });
        }
        res.status(500).send('Server error');
    }
};

// @route   POST /api/diet-plans
// @desc    Create a new diet plan
// @access  Private
export const createDietPlan = async (req, res) => {
    try {
        const {
            profileId,
            name,
            description,
            startDate,
            endDate,
            isActive,
            dailyMeals,
            dailyCalories,
            dailyProtein,
            dailyCarbs,
            dailyFats,
            healthGoals,
            dietaryRestrictions
        } = req.body;

        // Validate required fields
        if (!name || !profileId || !dailyMeals || !dailyCalories) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }

        const dietPlan = new DietPlan({
            userId: req.user.id,
            profileId,
            name,
            description,
            startDate: startDate || Date.now(),
            endDate,
            isActive: isActive !== undefined ? isActive : true,
            dailyMeals,
            dailyCalories,
            dailyProtein: dailyProtein || 0,
            dailyCarbs: dailyCarbs || 0,
            dailyFats: dailyFats || 0,
            healthGoals: healthGoals || [],
            dietaryRestrictions: dietaryRestrictions || []
        });

        await dietPlan.save();
        await dietPlan.populate('userId', 'name email');
        await dietPlan.populate('profileId');

        res.status(201).json(dietPlan);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error');
    }
};

// @route   PUT /api/diet-plans/:id
// @desc    Update a diet plan
// @access  Private
export const updateDietPlan = async (req, res) => {
    try {
        const {
            name,
            description,
            startDate,
            endDate,
            isActive,
            dailyMeals,
            dailyCalories,
            dailyProtein,
            dailyCarbs,
            dailyFats,
            healthGoals,
            dietaryRestrictions
        } = req.body;

        let dietPlan = await DietPlan.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!dietPlan) {
            return res.status(404).json({ msg: 'Diet plan not found' });
        }

        // Update fields
        if (name !== undefined) dietPlan.name = name;
        if (description !== undefined) dietPlan.description = description;
        if (startDate !== undefined) dietPlan.startDate = startDate;
        if (endDate !== undefined) dietPlan.endDate = endDate;
        if (isActive !== undefined) dietPlan.isActive = isActive;
        if (dailyMeals !== undefined) dietPlan.dailyMeals = dailyMeals;
        if (dailyCalories !== undefined) dietPlan.dailyCalories = dailyCalories;
        if (dailyProtein !== undefined) dietPlan.dailyProtein = dailyProtein;
        if (dailyCarbs !== undefined) dietPlan.dailyCarbs = dailyCarbs;
        if (dailyFats !== undefined) dietPlan.dailyFats = dailyFats;
        if (healthGoals !== undefined) dietPlan.healthGoals = healthGoals;
        if (dietaryRestrictions !== undefined) dietPlan.dietaryRestrictions = dietaryRestrictions;

        await dietPlan.save();
        await dietPlan.populate('userId', 'name email');
        await dietPlan.populate('profileId');

        res.json(dietPlan);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Diet plan not found' });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error');
    }
};

// @route   DELETE /api/diet-plans/:id
// @desc    Delete a diet plan
// @access  Private
export const deleteDietPlan = async (req, res) => {
    try {
        const dietPlan = await DietPlan.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!dietPlan) {
            return res.status(404).json({ msg: 'Diet plan not found' });
        }

        await dietPlan.deleteOne();

        res.json({ msg: 'Diet plan removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Diet plan not found' });
        }
        res.status(500).send('Server error');
    }
};

