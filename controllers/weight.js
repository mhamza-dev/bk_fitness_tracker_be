import { Weight } from '../models/index.js';

// @route   GET /api/weights
// @desc    Get all weight entries for the authenticated user
// @access  Private
export const getWeights = async (req, res) => {
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
        const weights = await Weight.find(query)
            .populate('userId', 'name email')
            .sort({ date: -1 })
            .limit(limitNum);

        // Calculate weight change if there are multiple entries
        let weightChange = null;
        if (weights.length > 1) {
            const latest = weights[0];
            const previous = weights[weights.length - 1];
            weightChange = {
                change: latest.weight - previous.weight,
                unit: latest.unit,
                percentage: ((latest.weight - previous.weight) / previous.weight * 100).toFixed(2)
            };
        }

        res.json({
            weights,
            weightChange
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET /api/weights/:id
// @desc    Get a specific weight entry by ID
// @access  Private
export const getWeightById = async (req, res) => {
    try {
        const weight = await Weight.findOne({
            _id: req.params.id,
            userId: req.user.id
        }).populate('userId', 'name email');

        if (!weight) {
            return res.status(404).json({ msg: 'Weight entry not found' });
        }

        res.json(weight);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Weight entry not found' });
        }
        res.status(500).send('Server error');
    }
};

// @route   GET /api/weights/latest
// @desc    Get the latest weight entry for the authenticated user
// @access  Private
export const getLatestWeight = async (req, res) => {
    try {
        const weight = await Weight.findOne({ userId: req.user.id })
            .populate('userId', 'name email')
            .sort({ date: -1 });

        if (!weight) {
            return res.status(404).json({ msg: 'No weight entries found' });
        }

        res.json(weight);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   POST /api/weights
// @desc    Create a new weight entry
// @access  Private
export const createWeight = async (req, res) => {
    try {
        const {
            weight,
            unit,
            bodyFat,
            muscleMass,
            muscleMassUnit,
            date,
            notes
        } = req.body;

        // Validate required fields
        if (!weight) {
            return res.status(400).json({ msg: 'Please provide weight' });
        }

        const weightEntry = new Weight({
            userId: req.user.id,
            weight,
            unit: unit || 'kg',
            bodyFat,
            muscleMass,
            muscleMassUnit: muscleMassUnit || 'kg',
            date: date ? new Date(date) : new Date(),
            notes
        });

        await weightEntry.save();
        await weightEntry.populate('userId', 'name email');

        res.status(201).json(weightEntry);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error');
    }
};

// @route   PUT /api/weights/:id
// @desc    Update a weight entry
// @access  Private
export const updateWeight = async (req, res) => {
    try {
        const {
            weight,
            unit,
            bodyFat,
            muscleMass,
            muscleMassUnit,
            date,
            notes
        } = req.body;

        let weightEntry = await Weight.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!weightEntry) {
            return res.status(404).json({ msg: 'Weight entry not found' });
        }

        // Update fields
        if (weight !== undefined) weightEntry.weight = weight;
        if (unit !== undefined) weightEntry.unit = unit;
        if (bodyFat !== undefined) weightEntry.bodyFat = bodyFat;
        if (muscleMass !== undefined) weightEntry.muscleMass = muscleMass;
        if (muscleMassUnit !== undefined) weightEntry.muscleMassUnit = muscleMassUnit;
        if (date !== undefined) weightEntry.date = new Date(date);
        if (notes !== undefined) weightEntry.notes = notes;

        await weightEntry.save();
        await weightEntry.populate('userId', 'name email');

        res.json(weightEntry);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Weight entry not found' });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error');
    }
};

// @route   DELETE /api/weights/:id
// @desc    Delete a weight entry
// @access  Private
export const deleteWeight = async (req, res) => {
    try {
        const weightEntry = await Weight.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!weightEntry) {
            return res.status(404).json({ msg: 'Weight entry not found' });
        }

        await weightEntry.deleteOne();
        res.json({ msg: 'Weight entry removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Weight entry not found' });
        }
        res.status(500).send('Server error');
    }
};

