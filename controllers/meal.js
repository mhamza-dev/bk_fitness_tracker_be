import { Meal } from '../models/index.js';

// @route   GET /api/meals
// @desc    Get all meals for the authenticated user
// @access  Private
export const getMeals = async (req, res) => {
    try {
        const { startDate, endDate, mealType, limit } = req.query;
        const query = { userId: req.user.id };

        // Filter by date range if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // Filter by meal type if provided
        if (mealType) {
            query.mealType = mealType;
        }

        const limitNum = limit ? parseInt(limit) : undefined;
        const meals = await Meal.find(query)
            .populate('userId', 'name email')
            .sort({ date: -1, time: -1 })
            .limit(limitNum);

        res.json(meals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET /api/meals/:id
// @desc    Get a specific meal by ID
// @access  Private
export const getMealById = async (req, res) => {
    try {
        const meal = await Meal.findOne({
            _id: req.params.id,
            userId: req.user.id
        }).populate('userId', 'name email');

        if (!meal) {
            return res.status(404).json({ msg: 'Meal not found' });
        }

        res.json(meal);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Meal not found' });
        }
        res.status(500).send('Server error');
    }
};

// @route   GET /api/meals/date/:date
// @desc    Get all meals for a specific date
// @access  Private
export const getMealsByDate = async (req, res) => {
    try {
        const date = new Date(req.params.date);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const meals = await Meal.find({
            userId: req.user.id,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        })
            .populate('userId', 'name email')
            .sort({ time: 1 });

        // Calculate daily totals
        const dailyTotals = {
            totalCalories: meals.reduce((sum, meal) => sum + (meal.totalCalories || 0), 0),
            totalProtein: meals.reduce((sum, meal) => sum + (meal.totalProtein || 0), 0),
            totalCarbs: meals.reduce((sum, meal) => sum + (meal.totalCarbs || 0), 0),
            totalFats: meals.reduce((sum, meal) => sum + (meal.totalFats || 0), 0),
        };

        res.json({
            meals,
            dailyTotals
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   POST /api/meals
// @desc    Create a new meal
// @access  Private
export const createMeal = async (req, res) => {
    try {
        const {
            mealType,
            date,
            time,
            items,
            notes,
            image
        } = req.body;

        // Validate required fields
        if (!mealType || !items || items.length === 0) {
            return res.status(400).json({ msg: 'Please provide mealType and items' });
        }

        // Calculate totals (will also be done by pre-save middleware, but good to have here too)
        const totalCalories = items.reduce((sum, item) => sum + (item.calories || 0), 0);
        const totalProtein = items.reduce((sum, item) => sum + (item.protein || 0), 0);
        const totalCarbs = items.reduce((sum, item) => sum + (item.carbs || 0), 0);
        const totalFats = items.reduce((sum, item) => sum + (item.fats || 0), 0);

        const meal = new Meal({
            userId: req.user.id,
            mealType,
            date: date ? new Date(date) : new Date(),
            time: time ? new Date(time) : new Date(),
            items,
            totalCalories,
            totalProtein,
            totalCarbs,
            totalFats,
            notes,
            image
        });

        await meal.save();
        await meal.populate('userId', 'name email');

        res.status(201).json(meal);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error');
    }
};

// @route   PUT /api/meals/:id
// @desc    Update a meal
// @access  Private
export const updateMeal = async (req, res) => {
    try {
        const {
            mealType,
            date,
            time,
            items,
            notes,
            image
        } = req.body;

        let meal = await Meal.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!meal) {
            return res.status(404).json({ msg: 'Meal not found' });
        }

        // Update fields
        if (mealType !== undefined) meal.mealType = mealType;
        if (date !== undefined) meal.date = new Date(date);
        if (time !== undefined) meal.time = new Date(time);
        if (items !== undefined) {
            meal.items = items;
            // Recalculate totals when items change
            meal.totalCalories = items.reduce((sum, item) => sum + (item.calories || 0), 0);
            meal.totalProtein = items.reduce((sum, item) => sum + (item.protein || 0), 0);
            meal.totalCarbs = items.reduce((sum, item) => sum + (item.carbs || 0), 0);
            meal.totalFats = items.reduce((sum, item) => sum + (item.fats || 0), 0);
        }
        if (notes !== undefined) meal.notes = notes;
        if (image !== undefined) meal.image = image;

        await meal.save();
        await meal.populate('userId', 'name email');

        res.json(meal);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Meal not found' });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error');
    }
};

// @route   DELETE /api/meals/:id
// @desc    Delete a meal
// @access  Private
export const deleteMeal = async (req, res) => {
    try {
        const meal = await Meal.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!meal) {
            return res.status(404).json({ msg: 'Meal not found' });
        }

        await meal.deleteOne();

        res.json({ msg: 'Meal removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Meal not found' });
        }
        res.status(500).send('Server error');
    }
};

