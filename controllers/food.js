import { Food } from '../models/index.js';

// @route   GET /api/foods
// @desc    Get all foods with optional filters
// @access  Private
export const getFoods = async (req, res) => {
    try {
        const {
            category,
            mealType,
            isVegetarian,
            isVegan,
            isGlutenFree,
            isDairyFree,
            search,
            limit,
            page
        } = req.query;

        const query = {};

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Filter by meal type
        if (mealType) {
            query.mealType = { $in: Array.isArray(mealType) ? mealType : [mealType] };
        }

        // Filter by dietary restrictions
        if (isVegetarian !== undefined) {
            query.isVegetarian = isVegetarian === 'true';
        }
        if (isVegan !== undefined) {
            query.isVegan = isVegan === 'true';
        }
        if (isGlutenFree !== undefined) {
            query.isGlutenFree = isGlutenFree === 'true';
        }
        if (isDairyFree !== undefined) {
            query.isDairyFree = isDairyFree === 'true';
        }

        // Search by name or description
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { nameUrdu: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const skip = (pageNum - 1) * limitNum;

        const foods = await Food.find(query)
            .sort({ name: 1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Food.countDocuments(query);

        res.json({
            foods,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET /api/foods/:id
// @desc    Get a specific food by ID
// @access  Private
export const getFoodById = async (req, res) => {
    try {
        const food = await Food.findById(req.params.id);

        if (!food) {
            return res.status(404).json({ msg: 'Food not found' });
        }

        res.json(food);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Food not found' });
        }
        res.status(500).send('Server error');
    }
};

// @route   POST /api/foods
// @desc    Create a new food item
// @access  Private
export const createFood = async (req, res) => {
    try {
        const {
            name,
            nameUrdu,
            description,
            calories,
            protein,
            carbs,
            fats,
            fiber,
            sugar,
            category,
            mealType,
            isVegetarian,
            isVegan,
            isGlutenFree,
            isDairyFree,
            allergens,
            typicalServing,
            servingUnit,
            contraindications
        } = req.body;

        // Validate required fields
        if (!name || calories === undefined) {
            return res.status(400).json({ msg: 'Please provide name and calories' });
        }

        const food = new Food({
            name,
            nameUrdu,
            description,
            calories,
            protein: protein || 0,
            carbs: carbs || 0,
            fats: fats || 0,
            fiber: fiber || 0,
            sugar: sugar || 0,
            category: category || 'other',
            mealType: mealType || [],
            isVegetarian: isVegetarian !== undefined ? isVegetarian : true,
            isVegan: isVegan || false,
            isGlutenFree: isGlutenFree || false,
            isDairyFree: isDairyFree || false,
            allergens: allergens || [],
            typicalServing: typicalServing || 100,
            servingUnit: servingUnit || 'grams',
            contraindications: contraindications || []
        });

        await food.save();
        res.status(201).json(food);
    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Food with this name already exists' });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error');
    }
};

// @route   PUT /api/foods/:id
// @desc    Update a food item
// @access  Private
export const updateFood = async (req, res) => {
    try {
        const {
            name,
            nameUrdu,
            description,
            calories,
            protein,
            carbs,
            fats,
            fiber,
            sugar,
            category,
            mealType,
            isVegetarian,
            isVegan,
            isGlutenFree,
            isDairyFree,
            allergens,
            typicalServing,
            servingUnit,
            contraindications
        } = req.body;

        let food = await Food.findById(req.params.id);

        if (!food) {
            return res.status(404).json({ msg: 'Food not found' });
        }

        // Update fields
        if (name !== undefined) food.name = name;
        if (nameUrdu !== undefined) food.nameUrdu = nameUrdu;
        if (description !== undefined) food.description = description;
        if (calories !== undefined) food.calories = calories;
        if (protein !== undefined) food.protein = protein;
        if (carbs !== undefined) food.carbs = carbs;
        if (fats !== undefined) food.fats = fats;
        if (fiber !== undefined) food.fiber = fiber;
        if (sugar !== undefined) food.sugar = sugar;
        if (category !== undefined) food.category = category;
        if (mealType !== undefined) food.mealType = mealType;
        if (isVegetarian !== undefined) food.isVegetarian = isVegetarian;
        if (isVegan !== undefined) food.isVegan = isVegan;
        if (isGlutenFree !== undefined) food.isGlutenFree = isGlutenFree;
        if (isDairyFree !== undefined) food.isDairyFree = isDairyFree;
        if (allergens !== undefined) food.allergens = allergens;
        if (typicalServing !== undefined) food.typicalServing = typicalServing;
        if (servingUnit !== undefined) food.servingUnit = servingUnit;
        if (contraindications !== undefined) food.contraindications = contraindications;

        await food.save();
        res.json(food);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Food not found' });
        }
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Food with this name already exists' });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error');
    }
};

// @route   DELETE /api/foods/:id
// @desc    Delete a food item
// @access  Private
export const deleteFood = async (req, res) => {
    try {
        const food = await Food.findById(req.params.id);

        if (!food) {
            return res.status(404).json({ msg: 'Food not found' });
        }

        await food.deleteOne();
        res.json({ msg: 'Food removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Food not found' });
        }
        res.status(500).send('Server error');
    }
};

// @route   GET /api/foods/search
// @desc    Search foods by name (query parameter)
// @access  Private
export const searchFoods = async (req, res) => {
    try {
        const { q: query, limit } = req.query;

        if (!query) {
            return res.status(400).json({ msg: 'Please provide search query (q parameter)' });
        }

        const limitNum = limit ? parseInt(limit) : 20;

        const foods = await Food.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { nameUrdu: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        })
            .sort({ name: 1 })
            .limit(limitNum);

        res.json(foods);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET /api/foods/for-profile
// @desc    Get foods filtered by user's profile preferences
// @access  Private
export const getFoodsForProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user.id });

        const query = {};

        if (profile) {
            if (profile.dietaryPreferences.includes('vegetarian')) {
                query.isVegetarian = true;
            }
            if (profile.dietaryPreferences.includes('vegan')) {
                query.isVegan = true;
            }
            if (profile.dietaryPreferences.includes('gluten_free')) {
                query.isGlutenFree = true;
            }
            if (profile.dietaryPreferences.includes('dairy_free')) {
                query.isDairyFree = true;
            }

            // Exclude foods with allergens that user is allergic to
            if (profile.allergies && profile.allergies.length > 0) {
                const allergenNames = profile.allergies.map(a => a.name.toLowerCase());
                const allergenMap = {
                    'wheat': 'wheat',
                    'dairy': 'dairy',
                    'nuts': 'nuts',
                    'eggs': 'eggs',
                    'soy': 'soy',
                    'fish': 'fish',
                    'shellfish': 'shellfish',
                    'sesame': 'sesame'
                };

                const allergensToExclude = [];
                allergenNames.forEach(name => {
                    if (allergenMap[name]) {
                        allergensToExclude.push(allergenMap[name]);
                    }
                });

                if (allergensToExclude.length > 0) {
                    query.allergens = { $nin: allergensToExclude };
                }
            }
        }

        const foods = await Food.find(query)
            .sort({ name: 1 })
            .limit(100);

        res.json(foods);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

