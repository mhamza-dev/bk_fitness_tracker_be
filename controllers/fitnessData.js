import { FitnessData } from '../models/index.js';

// @route   GET /api/fitness-data
// @desc    Get all fitness data for the authenticated user
// @access  Private
export const getFitnessData = async (req, res) => {
    try {
        const { startDate, endDate, limit } = req.query;
        const query = { userId: req.user.id };

        // Filter by date range if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const limitNum = limit ? parseInt(limit) : undefined;
        const fitnessData = await FitnessData.find(query)
            .populate('userId', 'name email')
            .sort({ date: -1 })
            .limit(limitNum);

        res.json(fitnessData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET /api/fitness-data/:id
// @desc    Get a specific fitness data entry by ID
// @access  Private
export const getFitnessDataById = async (req, res) => {
    try {
        const fitnessData = await FitnessData.findOne({
            _id: req.params.id,
            userId: req.user.id
        }).populate('userId', 'name email');

        if (!fitnessData) {
            return res.status(404).json({ msg: 'Fitness data not found' });
        }

        res.json(fitnessData);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Fitness data not found' });
        }
        res.status(500).send('Server error');
    }
};

// @route   GET /api/fitness-data/date/:date
// @desc    Get fitness data for a specific date
// @access  Private
export const getFitnessDataByDate = async (req, res) => {
    try {
        const date = new Date(req.params.date);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const fitnessData = await FitnessData.findOne({
            userId: req.user.id,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).populate('userId', 'name email');

        if (!fitnessData) {
            return res.status(404).json({ msg: 'Fitness data not found for this date' });
        }

        res.json(fitnessData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   POST /api/fitness-data
// @desc    Create a new fitness data entry
// @access  Private
export const createFitnessData = async (req, res) => {
    try {
        const {
            date,
            steps,
            distance,
            distanceUnit,
            caloriesBurned,
            workouts,
            waterIntake,
            waterUnit,
            sleepHours,
            sleepQuality,
            notes
        } = req.body;

        // Check if fitness data already exists for this date
        const dateToUse = date ? new Date(date) : new Date();
        const startOfDay = new Date(dateToUse.setHours(0, 0, 0, 0));
        const endOfDay = new Date(dateToUse.setHours(23, 59, 59, 999));

        const existingData = await FitnessData.findOne({
            userId: req.user.id,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        if (existingData) {
            return res.status(400).json({ 
                msg: 'Fitness data already exists for this date. Use PUT to update instead.' 
            });
        }

        const fitnessData = new FitnessData({
            userId: req.user.id,
            date: dateToUse,
            steps: steps || 0,
            distance: distance || 0,
            distanceUnit: distanceUnit || 'km',
            caloriesBurned: caloriesBurned || 0,
            workouts: workouts || [],
            waterIntake: waterIntake || 0,
            waterUnit: waterUnit || 'ml',
            sleepHours,
            sleepQuality,
            notes
        });

        await fitnessData.save();
        await fitnessData.populate('userId', 'name email');

        res.status(201).json(fitnessData);
    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) {
            return res.status(400).json({ 
                msg: 'Fitness data already exists for this date. Use PUT to update instead.' 
            });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error');
    }
};

// @route   PUT /api/fitness-data/:id
// @desc    Update a fitness data entry
// @access  Private
export const updateFitnessData = async (req, res) => {
    try {
        const {
            date,
            steps,
            distance,
            distanceUnit,
            caloriesBurned,
            workouts,
            waterIntake,
            waterUnit,
            sleepHours,
            sleepQuality,
            notes
        } = req.body;

        let fitnessData = await FitnessData.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!fitnessData) {
            return res.status(404).json({ msg: 'Fitness data not found' });
        }

        // Update fields
        if (date !== undefined) fitnessData.date = new Date(date);
        if (steps !== undefined) fitnessData.steps = steps;
        if (distance !== undefined) fitnessData.distance = distance;
        if (distanceUnit !== undefined) fitnessData.distanceUnit = distanceUnit;
        if (caloriesBurned !== undefined) fitnessData.caloriesBurned = caloriesBurned;
        if (workouts !== undefined) fitnessData.workouts = workouts;
        if (waterIntake !== undefined) fitnessData.waterIntake = waterIntake;
        if (waterUnit !== undefined) fitnessData.waterUnit = waterUnit;
        if (sleepHours !== undefined) fitnessData.sleepHours = sleepHours;
        if (sleepQuality !== undefined) fitnessData.sleepQuality = sleepQuality;
        if (notes !== undefined) fitnessData.notes = notes;

        await fitnessData.save();
        await fitnessData.populate('userId', 'name email');

        res.json(fitnessData);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Fitness data not found' });
        }
        if (err.code === 11000) {
            return res.status(400).json({ 
                msg: 'Fitness data already exists for this date' 
            });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error');
    }
};

// @route   PUT /api/fitness-data/date/:date
// @desc    Update or create fitness data for a specific date
// @access  Private
export const upsertFitnessDataByDate = async (req, res) => {
    try {
        const date = new Date(req.params.date);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const {
            steps,
            distance,
            distanceUnit,
            caloriesBurned,
            workouts,
            waterIntake,
            waterUnit,
            sleepHours,
            sleepQuality,
            notes
        } = req.body;

        let fitnessData = await FitnessData.findOne({
            userId: req.user.id,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        if (fitnessData) {
            // Update existing entry
            if (steps !== undefined) fitnessData.steps = steps;
            if (distance !== undefined) fitnessData.distance = distance;
            if (distanceUnit !== undefined) fitnessData.distanceUnit = distanceUnit;
            if (caloriesBurned !== undefined) fitnessData.caloriesBurned = caloriesBurned;
            if (workouts !== undefined) fitnessData.workouts = workouts;
            if (waterIntake !== undefined) fitnessData.waterIntake = waterIntake;
            if (waterUnit !== undefined) fitnessData.waterUnit = waterUnit;
            if (sleepHours !== undefined) fitnessData.sleepHours = sleepHours;
            if (sleepQuality !== undefined) fitnessData.sleepQuality = sleepQuality;
            if (notes !== undefined) fitnessData.notes = notes;
        } else {
            // Create new entry
            fitnessData = new FitnessData({
                userId: req.user.id,
                date: date,
                steps: steps || 0,
                distance: distance || 0,
                distanceUnit: distanceUnit || 'km',
                caloriesBurned: caloriesBurned || 0,
                workouts: workouts || [],
                waterIntake: waterIntake || 0,
                waterUnit: waterUnit || 'ml',
                sleepHours,
                sleepQuality,
                notes
            });
        }

        await fitnessData.save();
        await fitnessData.populate('userId', 'name email');

        res.json(fitnessData);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error');
    }
};

// @route   DELETE /api/fitness-data/:id
// @desc    Delete a fitness data entry
// @access  Private
export const deleteFitnessData = async (req, res) => {
    try {
        const fitnessData = await FitnessData.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!fitnessData) {
            return res.status(404).json({ msg: 'Fitness data not found' });
        }

        await fitnessData.deleteOne();

        res.json({ msg: 'Fitness data removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Fitness data not found' });
        }
        res.status(500).send('Server error');
    }
};

