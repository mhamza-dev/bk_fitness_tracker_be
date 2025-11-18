import mongoose from 'mongoose';

const { Schema } = mongoose;

const foodItemSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    unit: {
        type: String,
        required: true,
        trim: true,
    },
    calories: {
        type: Number,
        required: true,
        min: 0,
    },
    protein: {
        type: Number,
        default: 0,
        min: 0,
    },
    carbs: {
        type: Number,
        default: 0,
        min: 0,
    },
    fats: {
        type: Number,
        default: 0,
        min: 0,
    },
    fiber: {
        type: Number,
        default: 0,
        min: 0,
    },
    sugar: {
        type: Number,
        default: 0,
        min: 0,
    },
}, { _id: false });

const mealSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    // Meal details
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
        index: true,
    },
    time: {
        type: Date,
        default: Date.now,
    },
    // Food items
    items: {
        type: [foodItemSchema],
        required: true,
    },
    // Totals
    totalCalories: {
        type: Number,
        required: true,
        min: 0,
    },
    totalProtein: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalCarbs: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalFats: {
        type: Number,
        default: 0,
        min: 0,
    },
    // Additional info
    notes: {
        type: String,
        trim: true,
    },
    image: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});

// Indexes
mealSchema.index({ userId: 1, date: -1 });
mealSchema.index({ userId: 1, mealType: 1, date: -1 });

// Pre-save middleware to calculate totals
mealSchema.pre('save', function (next) {
    if (this.items && this.items.length > 0) {
        this.totalCalories = this.items.reduce((sum, item) => sum + (item.calories || 0), 0);
        this.totalProtein = this.items.reduce((sum, item) => sum + (item.protein || 0), 0);
        this.totalCarbs = this.items.reduce((sum, item) => sum + (item.carbs || 0), 0);
        this.totalFats = this.items.reduce((sum, item) => sum + (item.fats || 0), 0);
    }
    next();
});

const Meal = mongoose.models.Meal || mongoose.model('Meal', mealSchema);

export default Meal;

