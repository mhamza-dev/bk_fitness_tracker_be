import mongoose from 'mongoose';

const { Schema } = mongoose;

const fitnessDataSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Date tracking
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    // Step tracking
    steps: {
        type: Number,
        default: 0,
        min: 0,
    },
    distance: {
        type: Number,
        default: 0,
        min: 0,
    },
    distanceUnit: {
        type: String,
        enum: ['km', 'miles'],
        default: 'km',
    },
    caloriesBurned: {
        type: Number,
        default: 0,
        min: 0,
    },
    // Workout data
    workouts: [{
        type: {
            type: String,
            enum: ['cardio', 'strength', 'flexibility', 'sports', 'other'],
        },
        duration: {
            type: Number,
            min: 0,
        },
        durationUnit: {
            type: String,
            enum: ['minutes', 'hours'],
            default: 'minutes',
        },
        caloriesBurned: {
            type: Number,
            min: 0,
        },
        notes: {
            type: String,
            trim: true,
        },
    }],
    // Water intake
    waterIntake: {
        type: Number,
        default: 0,
        min: 0,
    },
    waterUnit: {
        type: String,
        enum: ['ml', 'liters', 'cups', 'oz'],
        default: 'ml',
    },
    // Sleep tracking
    sleepHours: {
        type: Number,
        min: 0,
        max: 24,
    },
    sleepQuality: {
        type: String,
        enum: ['poor', 'fair', 'good', 'excellent'],
    },
    // Notes
    notes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});

// Indexes
fitnessDataSchema.index({ userId: 1, date: -1 });
fitnessDataSchema.index({ date: -1 });

// Compound unique index to prevent duplicate entries for same user and date
fitnessDataSchema.index({ userId: 1, date: 1 }, { unique: true });

const FitnessData = mongoose.models.FitnessData || mongoose.model('FitnessData', fitnessDataSchema, 'fitness_data');

export default FitnessData;

