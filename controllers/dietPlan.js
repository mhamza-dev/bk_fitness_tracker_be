import { DietPlan, Profile, Food } from '../models/index.js';

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

// @route   GET /api/diet-plans/user
// @desc    Get all diet plans for a user with options
// @access  Private
export const getUserDietPlans = async (req, res) => {
    try {
        const { isActive, limit, sortBy = 'startDate', sortOrder = 'desc' } = req.query;
        const query = { userId: req.user.id };

        // Filter by active status if provided
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const limitNum = limit ? parseInt(limit) : undefined;
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const dietPlans = await DietPlan.find(query)
            .populate('userId', 'name email')
            .populate('profileId')
            .sort(sortOptions)
            .limit(limitNum);

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

// @route   GET /api/diet-plans/active
// @desc    Get user's active diet plan
// @access  Private
export const getActiveDietPlan = async (req, res) => {
    try {
        const dietPlan = await DietPlan.findOne({
            userId: req.user.id,
            isActive: true
        })
            .populate('userId', 'name email')
            .populate('profileId')
            .sort({ startDate: -1 });

        if (!dietPlan) {
            return res.status(404).json({ msg: 'No active diet plan found' });
        }

        res.json(dietPlan);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   PUT /api/diet-plans/:id/deactivate
// @desc    Deactivate a diet plan
// @access  Private
export const deactivateDietPlan = async (req, res) => {
    try {
        const dietPlan = await DietPlan.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!dietPlan) {
            return res.status(404).json({ msg: 'Diet plan not found' });
        }

        dietPlan.isActive = false;
        await dietPlan.save();
        await dietPlan.populate('userId', 'name email');
        await dietPlan.populate('profileId');

        res.json({ 
            msg: 'Diet plan deactivated successfully',
            dietPlan 
        });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Diet plan not found' });
        }
        res.status(500).send('Server error');
    }
};

// @route   POST /api/diet-plans/suggestions
// @desc    Generate diet plan suggestions based on user profile
// @access  Private
export const generateDietPlanSuggestions = async (req, res) => {
    try {
        // Get user profile
        const profile = await Profile.findOne({ userId: req.user.id });

        if (!profile) {
            return res.status(404).json({ 
                msg: 'Profile not found. Please create a profile first.' 
            });
        }

        // Calculate daily calorie needs based on profile
        // Using Harris-Benedict equation (simplified)
        const age = profile.age;
        const weight = profile.weightUnit === 'kg' ? profile.weight : profile.weight * 0.453592;
        // Convert height to cm
        const heightInCm = profile.heightUnit === 'cm' ? profile.height : 
                          profile.heightUnit === 'ft' ? profile.height * 30.48 : 
                          profile.height * 2.54;

        // BMR calculation (Harris-Benedict equation)
        let bmr;
        if (profile.gender === 'male') {
            bmr = 88.362 + (13.397 * weight) + (4.799 * heightInCm) - (5.677 * age);
        } else {
            bmr = 447.593 + (9.247 * weight) + (3.098 * heightInCm) - (4.330 * age);
        }

        // Activity multiplier
        const activityMultipliers = {
            sedentary: 1.2,
            lightly_active: 1.375,
            moderately_active: 1.55,
            very_active: 1.725,
            extremely_active: 1.9
        };

        const dailyCalories = Math.round(bmr * (activityMultipliers[profile.activityLevel] || 1.55));

        // Adjust based on health goals
        let adjustedCalories = dailyCalories;
        if (profile.healthGoals.includes('weight_loss')) {
            adjustedCalories = Math.round(dailyCalories * 0.85); // 15% deficit
        } else if (profile.healthGoals.includes('weight_gain')) {
            adjustedCalories = Math.round(dailyCalories * 1.15); // 15% surplus
        } else if (profile.healthGoals.includes('muscle_gain')) {
            adjustedCalories = Math.round(dailyCalories * 1.1); // 10% surplus
        }

        // Calculate macronutrients (simplified)
        const dailyProtein = Math.round(adjustedCalories * 0.25 / 4); // 25% from protein
        const dailyCarbs = Math.round(adjustedCalories * 0.45 / 4); // 45% from carbs
        const dailyFats = Math.round(adjustedCalories * 0.30 / 9); // 30% from fats

        // Get food suggestions based on dietary preferences
        const foodQuery = {};
        if (profile.dietaryPreferences.includes('vegetarian')) {
            foodQuery.isVegetarian = true;
        }
        if (profile.dietaryPreferences.includes('vegan')) {
            foodQuery.isVegan = true;
        }
        if (profile.dietaryPreferences.includes('gluten_free')) {
            foodQuery.isGlutenFree = true;
        }
        if (profile.dietaryPreferences.includes('dairy_free')) {
            foodQuery.isDairyFree = true;
        }

        // Get suggested foods
        const suggestedFoods = await Food.find(foodQuery)
            .limit(50)
            .sort({ calories: 1 });

        // Generate meal suggestions (simplified structure)
        const mealSuggestions = {
            breakfast: suggestedFoods
                .filter(f => f.mealType.includes('breakfast'))
                .slice(0, 5)
                .map(f => ({
                    name: f.name,
                    quantity: f.typicalServing,
                    unit: f.servingUnit,
                    calories: Math.round((f.calories * f.typicalServing) / 100)
                })),
            lunch: suggestedFoods
                .filter(f => f.mealType.includes('lunch'))
                .slice(0, 5)
                .map(f => ({
                    name: f.name,
                    quantity: f.typicalServing,
                    unit: f.servingUnit,
                    calories: Math.round((f.calories * f.typicalServing) / 100)
                })),
            dinner: suggestedFoods
                .filter(f => f.mealType.includes('dinner'))
                .slice(0, 5)
                .map(f => ({
                    name: f.name,
                    quantity: f.typicalServing,
                    unit: f.servingUnit,
                    calories: Math.round((f.calories * f.typicalServing) / 100)
                })),
            snack: suggestedFoods
                .filter(f => f.mealType.includes('snack'))
                .slice(0, 3)
                .map(f => ({
                    name: f.name,
                    quantity: f.typicalServing,
                    unit: f.servingUnit,
                    calories: Math.round((f.calories * f.typicalServing) / 100)
                }))
        };

        res.json({
            suggestions: {
                dailyCalories: adjustedCalories,
                dailyProtein,
                dailyCarbs,
                dailyFats,
                mealSuggestions,
                basedOn: {
                    profile: {
                        age,
                        weight: profile.weight,
                        weightUnit: profile.weightUnit,
                        height: profile.height,
                        heightUnit: profile.heightUnit,
                        activityLevel: profile.activityLevel,
                        healthGoals: profile.healthGoals,
                        dietaryPreferences: profile.dietaryPreferences
                    }
                }
            }
        });
    } catch (err) {
        console.error(err.message);
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

