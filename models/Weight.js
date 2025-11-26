import mongoose from 'mongoose';

const { Schema } = mongoose;

const weightSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    // Weight data
    weight: {
        type: Number,
        required: true,
        min: [1, 'Weight must be greater than 0'],
        max: [500, 'Weight must be less than 500 kg'],
    },
    unit: {
        type: String,
        enum: ['kg', 'lbs'],
        default: 'kg',
    },
    // Body measurements (optional)
    bodyFat: {
        type: Number,
        min: 0,
        max: 100,
    },
    muscleMass: {
        type: Number,
        min: 0,
    },
    muscleMassUnit: {
        type: String,
        enum: ['kg', 'lbs'],
        default: 'kg',
    },
    // Date and time
    date: {
        type: Date,
        required: true,
        default: Date.now,
        index: true,
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
weightSchema.index({ userId: 1, date: -1 });
weightSchema.index({ date: -1 });

const Weight = mongoose.models.Weight || mongoose.model('Weight', weightSchema, 'weights');

export default Weight;

