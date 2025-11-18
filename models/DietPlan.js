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
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        required: true,
    },
    items: {
        type: [foodItemSchema],
        required: true,
    },
    totalCalories: {
        type: Number,
        required: true,
    },
    notes: {
        type: String,
        trim: true,
    },
}, { _id: false });

const dietPlanSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    profileId: {
        type: Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
    },
    // Plan details
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    endDate: {
        type: Date,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // Daily meal plan
    dailyMeals: {
        type: [mealSchema],
        required: true,
    },
    // Daily targets
    dailyCalories: {
        type: Number,
        required: true,
    },
    dailyProtein: {
        type: Number,
        default: 0,
    },
    dailyCarbs: {
        type: Number,
        default: 0,
    },
    dailyFats: {
        type: Number,
        default: 0,
    },
    // Plan metadata
    healthGoals: {
        type: [String],
        enum: ['weight_loss', 'weight_gain', 'muscle_gain', 'maintenance', 'improve_health', 'manage_condition'],
        default: [],
    },
    dietaryRestrictions: {
        type: [String],
        enum: ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'keto', 'paleo', 'mediterranean'],
        default: [],
    },
}, {
    timestamps: true,
});

// Indexes
dietPlanSchema.index({ userId: 1, isActive: 1 });
dietPlanSchema.index({ startDate: -1 });

const DietPlan = mongoose.models.DietPlan || mongoose.model('DietPlan', dietPlanSchema);

export default DietPlan;

