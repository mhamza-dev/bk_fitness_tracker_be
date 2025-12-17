import { Subscription, Profile, DietPlan } from '../models/index.js';
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

/**
 * Subscription Constants
 */

/**
 * Free plan - default plan for all users
 * Free plan users have restricted access to premium features
 */
export const FREE_PLAN = {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'PKR',
    duration: null, // Unlimited
    features: [
        'View feed posts',
        'Basic fitness tracking',
    ],
    restrictions: [
        'Cannot like posts',
        'Cannot comment on posts',
        'Cannot create or share posts',
        'Cannot access personalized diet plans',
    ],
};

/**
 * Premium subscription features available with active subscription
 */
export const SUBSCRIPTION_FEATURES = [
    'Like posts',
    'Comment on posts',
    'Create and share posts',
    'Personalized daily diet plan (breakfast, lunch, dinner, snacks, cheat-day meals)',
    'Track and monitor diet plan progress',
];

/**
 * Premium subscription plans available for purchase
 * Default plans used as fallback when API fails
 */
export const DEFAULT_SUBSCRIPTION_PLANS = [
    {
        id: 'monthly',
        name: 'Monthly',
        price: 4999,
        currency: 'PKR',
        duration: 30,
        features: SUBSCRIPTION_FEATURES,
    },
    {
        id: 'yearly',
        name: 'Yearly',
        price: 49999,
        currency: 'PKR',
        duration: 365,
        features: [...SUBSCRIPTION_FEATURES, 'Save 17%'],
    },
];

// @route   GET /api/subscriptions/current
// @desc    Get current subscription for authenticated user
// @access  Private
export const getSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ userId: req.user.id });

        if (!subscription) {
            return res.json({
                status: 'none',
                plan: null,
            });
        }

        const isActive = subscription.isActive();

        res.json({
            status: isActive ? 'active' : subscription.status,
            plan: {
                id: subscription.planId,
                name: subscription.planName,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                cancelledAt: subscription.cancelledAt,
            },
            isActive,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @route   GET /api/subscriptions/plans
// @desc    Get all available subscription plans
// @access  Private
export const getPlans = async (req, res) => {
    try {
        res.json(DEFAULT_SUBSCRIPTION_PLANS);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @route   POST /api/subscriptions/purchase
// @desc    Purchase a subscription plan
// @access  Private
export const purchaseSubscription = async (req, res) => {
    try {
        const { planId } = req.body;

        if (!planId) {
            return res.status(400).json({ msg: 'Please provide planId' });
        }

        // Find the plan
        const plan = DEFAULT_SUBSCRIPTION_PLANS.find(p => p.id === planId);
        if (!plan) {
            return res.status(400).json({ msg: 'Invalid plan ID' });
        }

        // Check if user already has an active subscription
        const existingSubscription = await Subscription.findOne({ userId: req.user.id });

        let subscription;
        const now = new Date();
        let endDate = null;

        // Calculate end date based on plan duration (in days)
        if (plan.duration) {
            endDate = new Date(now);
            endDate.setDate(endDate.getDate() + plan.duration);
        }
        // For null duration (unlimited), endDate remains null

        if (existingSubscription) {
            // Update existing subscription
            existingSubscription.planId = plan.id;
            existingSubscription.planName = plan.name;
            existingSubscription.status = 'active';
            existingSubscription.startDate = now;
            existingSubscription.endDate = endDate;
            existingSubscription.cancelledAt = null;
            subscription = await existingSubscription.save();
        } else {
            // Create new subscription
            subscription = await Subscription.create({
                userId: req.user.id,
                planId: plan.id,
                planName: plan.name,
                status: 'active',
                startDate: now,
                endDate: endDate,
            });
        }

        // Generate personalized diet plan for today
        try {
            const profile = await Profile.findOne({ userId: req.user.id });
            if (profile) {
                // Get today's date in user's timezone
                const today = getTodayInTimezone(profile.timezone);

                // Check if diet plan already exists for today
                const existingPlan = await DietPlan.findOne({
                    userId: req.user.id,
                    date: today,
                });

                if (!existingPlan) {
                    const planData = await generateDietPlan(profile, today);
                    await DietPlan.create({
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
                } else {
                    const planData = await generateDietPlan(profile, today);
                    existingPlan.meals = planData.meals;
                    existingPlan.dailyCalories = planData.dailyCalories;
                    existingPlan.dailyProtein = planData.dailyProtein;
                    existingPlan.dailyCarbs = planData.dailyCarbs;
                    existingPlan.dailyFats = planData.dailyFats;
                    existingPlan.generatedByAI = true;
                    await existingPlan.save();
                }
            }
        } catch (dietPlanError) {
            // Log error but don't fail the subscription purchase
            console.error('Error generating diet plan:', dietPlanError.message);
        }

        res.json({
            msg: 'Subscription purchased successfully',
            subscription: {
                id: subscription._id,
                planId: subscription.planId,
                planName: subscription.planName,
                status: subscription.status,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
            },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @route   POST /api/subscriptions/cancel
// @desc    Cancel current subscription
// @access  Private
export const cancelSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ userId: req.user.id });

        if (!subscription) {
            return res.status(404).json({ msg: 'No subscription found' });
        }

        if (subscription.status === 'cancelled') {
            return res.status(400).json({ msg: 'Subscription is already cancelled' });
        }

        subscription.status = 'cancelled';
        subscription.cancelledAt = new Date();
        await subscription.save();

        res.json({
            msg: 'Subscription cancelled successfully',
            subscription: {
                id: subscription._id,
                planId: subscription.planId,
                planName: subscription.planName,
                status: subscription.status,
                cancelledAt: subscription.cancelledAt,
            },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};
