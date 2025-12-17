import { DietPlan, Profile, Subscription } from '../models/index.js';
import { generateDietPlan } from '../services/aiService.js';

/**
 * Get "today" date in user's timezone, normalized to UTC midnight
 * @param {string} timezone - IANA timezone identifier (e.g., "America/Los_Angeles", "Asia/Karachi")
 * @returns {Date} Date object normalized to UTC midnight for the calendar day in the user's timezone
 */
const getTodayInTimezone = (timezone = 'UTC') => {
    try {
        const now = new Date();
        // Get date components in user's timezone
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        const parts = formatter.formatToParts(now);
        const year = parseInt(parts.find(p => p.type === 'year').value, 10);
        const month = parseInt(parts.find(p => p.type === 'month').value, 10) - 1; // Month is 0-indexed
        const day = parseInt(parts.find(p => p.type === 'day').value, 10);

        // Create UTC date at midnight for that calendar day
        const today = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        return today;
    } catch (error) {
        // If timezone is invalid, fallback to UTC
        console.warn(`Invalid timezone "${timezone}", falling back to UTC`);
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        today.setUTCMilliseconds(0);
        return today;
    }
};

// @route   GET /api/diet-plans/today
// @desc    Get today's diet plan for the authenticated user
// @access  Private
export const getTodayDietPlan = async (req, res) => {
    try {
        // Check if user has active subscription
        const subscription = await Subscription.findOne({ userId: req.user.id });
        if (!subscription || !subscription.isActive()) {
            return res.status(403).json({
                msg: 'Active subscription required to access personalized diet plans'
            });
        }

        // Get profile to access timezone
        const profile = await Profile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({
                msg: 'Profile not found. Please create a profile first.'
            });
        }

        // Get today's date in user's timezone
        const today = getTodayInTimezone(profile.timezone);

        let dietPlan = await DietPlan.findOne({
            userId: req.user.id,
            date: today,
        }).populate('profileId');

        // If no plan exists for today, generate one
        if (!dietPlan) {
            try {
                const planData = await generateDietPlan(profile, today);

                dietPlan = await DietPlan.create({
                    userId: req.user.id,
                    profileId: profile._id,
                    date: today,
                    meals: planData.meals,
                    dailyCalories: planData.dailyCalories,
                    dailyProtein: planData.dailyProtein,
                    dailyCarbs: planData.dailyCarbs,
                    dailyFats: planData.dailyFats,
                    generatedByAI: true,
                });

                await dietPlan.populate('profileId');
            } catch (error) {
                console.error('Error generating diet plan:', error);
                return res.status(500).json({ msg: 'Error generating diet plan' });
            }
        }

        res.json(dietPlan);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @route   GET /api/diet-plans/date/:date
// @desc    Get diet plan for a specific date (format: YYYY-MM-DD)
// @access  Private
export const getDietPlanByDate = async (req, res) => {
    try {
        // Check if user has active subscription
        const subscription = await Subscription.findOne({ userId: req.user.id });
        if (!subscription || !subscription.isActive()) {
            return res.status(403).json({
                msg: 'Active subscription required to access personalized diet plans'
            });
        }

        // Validate date format before querying database
        const date = new Date(req.params.date);
        if (isNaN(date.getTime())) {
            return res.status(400).json({ msg: 'Invalid date format. Use YYYY-MM-DD' });
        }

        date.setUTCHours(0, 0, 0, 0);
        date.setUTCMilliseconds(0);

        const dietPlan = await DietPlan.findOne({
            userId: req.user.id,
            date: date,
        }).populate('profileId');

        if (!dietPlan) {
            return res.status(404).json({ msg: 'Diet plan not found for this date' });
        }

        res.json(dietPlan);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'CastError') {
            return res.status(400).json({ msg: 'Invalid date format. Use YYYY-MM-DD' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};

// @route   GET /api/diet-plans
// @desc    Get all diet plans for the authenticated user (with optional date range)
// @access  Private
export const getDietPlans = async (req, res) => {
    try {
        // Check if user has active subscription
        const subscription = await Subscription.findOne({ userId: req.user.id });
        if (!subscription || !subscription.isActive()) {
            return res.status(403).json({
                msg: 'Active subscription required to access personalized diet plans'
            });
        }

        const { startDate, endDate, limit } = req.query;
        const query = { userId: req.user.id };

        // Add date range filter if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                const start = new Date(startDate);
                if (isNaN(start.getTime())) {
                    return res.status(400).json({ msg: 'Invalid startDate format. Use YYYY-MM-DD' });
                }
                start.setUTCHours(0, 0, 0, 0);
                start.setUTCMilliseconds(0);
                query.date.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                if (isNaN(end.getTime())) {
                    return res.status(400).json({ msg: 'Invalid endDate format. Use YYYY-MM-DD' });
                }
                end.setUTCHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        // Validate and parse limit parameter
        let limitNum = 30; // Default to 30 days
        if (limit) {
            const parsedLimit = parseInt(limit, 10);
            if (isNaN(parsedLimit) || parsedLimit <= 0) {
                return res.status(400).json({ msg: 'Invalid limit parameter. Must be a positive number' });
            }
            limitNum = parsedLimit;
        }

        const dietPlans = await DietPlan.find(query)
            .populate('profileId')
            .sort({ date: -1 })
            .limit(limitNum);

        res.json(dietPlans);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @route   POST /api/diet-plans/generate
// @desc    Generate or regenerate today's diet plan
// @access  Private
export const generateTodayDietPlan = async (req, res) => {
    try {
        // Check if user has active subscription
        const subscription = await Subscription.findOne({ userId: req.user.id });
        if (!subscription || !subscription.isActive()) {
            return res.status(403).json({
                msg: 'Active subscription required to generate personalized diet plans'
            });
        }

        const profile = await Profile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({
                msg: 'Profile not found. Please create a profile first.'
            });
        }

        // Get today's date in user's timezone
        const today = getTodayInTimezone(profile.timezone);

        // Generate new diet plan
        const planData = await generateDietPlan(profile, today);

        // Check if plan already exists and update, otherwise create
        let dietPlan = await DietPlan.findOne({
            userId: req.user.id,
            date: today,
        });

        if (dietPlan) {
            // Update existing plan
            dietPlan.meals = planData.meals;
            dietPlan.dailyCalories = planData.dailyCalories;
            dietPlan.dailyProtein = planData.dailyProtein;
            dietPlan.dailyCarbs = planData.dailyCarbs;
            dietPlan.dailyFats = planData.dailyFats;
            dietPlan.generatedByAI = true;
            await dietPlan.save();
            await dietPlan.populate('profileId');
        } else {
            // Create new plan
            dietPlan = await DietPlan.create({
                userId: req.user.id,
                profileId: profile._id,
                date: today,
                meals: planData.meals,
                dailyCalories: planData.dailyCalories,
                dailyProtein: planData.dailyProtein,
                dailyCarbs: planData.dailyCarbs,
                dailyFats: planData.dailyFats,
                generatedByAI: true,
            });
            await dietPlan.populate('profileId');
        }

        res.json({
            msg: 'Diet plan generated successfully',
            dietPlan,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @route   PUT /api/diet-plans/:id
// @desc    Update a diet plan (allow manual adjustments)
// @access  Private
export const updateDietPlan = async (req, res) => {
    try {
        // Check if user has active subscription
        const subscription = await Subscription.findOne({ userId: req.user.id });
        if (!subscription || !subscription.isActive()) {
            return res.status(403).json({
                msg: 'Active subscription required to update diet plans'
            });
        }

        const { meals, dailyCalories, dailyProtein, dailyCarbs, dailyFats } = req.body;

        const dietPlan = await DietPlan.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!dietPlan) {
            return res.status(404).json({ msg: 'Diet plan not found' });
        }

        // Update fields
        if (meals !== undefined) dietPlan.meals = meals;
        if (dailyCalories !== undefined) dietPlan.dailyCalories = dailyCalories;
        if (dailyProtein !== undefined) dietPlan.dailyProtein = dailyProtein;
        if (dailyCarbs !== undefined) dietPlan.dailyCarbs = dailyCarbs;
        if (dailyFats !== undefined) dietPlan.dailyFats = dailyFats;

        await dietPlan.save();
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
        res.status(500).json({ msg: 'Server error' });
    }
};

// @route   DELETE /api/diet-plans/:id
// @desc    Delete a diet plan
// @access  Private
export const deleteDietPlan = async (req, res) => {
    try {
        const dietPlan = await DietPlan.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!dietPlan) {
            return res.status(404).json({ msg: 'Diet plan not found' });
        }

        await dietPlan.deleteOne();

        res.json({ msg: 'Diet plan deleted successfully' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Diet plan not found' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};
