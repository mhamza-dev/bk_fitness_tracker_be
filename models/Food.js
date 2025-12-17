import mongoose from 'mongoose';

const { Schema } = mongoose;

const foodSchema = new Schema({
    // Food details
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    nameUrdu: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    // Nutritional information per 100g
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
    // Food categorization
    category: {
        type: String,
        enum: ['bread', 'rice', 'curry', 'meat', 'vegetable', 'dal', 'snack', 'dessert', 'beverage', 'fast_food', 'fried', 'seafood', 'salad', 'other'],
        default: 'other',
    },
    mealType: {
        type: [String],
        enum: ['breakfast', 'lunch', 'dinner', 'snack', 'side'],
        default: [],
    },
    // Dietary information
    isVegetarian: {
        type: Boolean,
        default: true,
    },
    isVegan: {
        type: Boolean,
        default: false,
    },
    isGlutenFree: {
        type: Boolean,
        default: false,
    },
    isDairyFree: {
        type: Boolean,
        default: false,
    },
    // Common allergens
    allergens: {
        type: [String],
        enum: ['wheat', 'dairy', 'nuts', 'eggs', 'soy', 'fish', 'shellfish', 'sesame'],
        default: [],
    },
    // Serving size (typical serving in grams)
    typicalServing: {
        type: Number,
        default: 100,
        min: 0,
    },
    servingUnit: {
        type: String,
        default: 'grams',
    },
    // Health contraindications
    contraindications: {
        type: [{
            condition: {
                type: String,
                required: true,
                trim: true,
            },
            label: {
                type: String,
                required: true,
                trim: true,
            },
            reason: {
                type: String,
                trim: true,
            },
        }],
        default: [],
    },
}, {
    timestamps: true,
});

// Indexes
// Note: name already has unique index from unique: true in schema
foodSchema.index({ category: 1 });
foodSchema.index({ isVegetarian: 1 });
foodSchema.index({ mealType: 1 });

const Food = mongoose.models.Food || mongoose.model('Food', foodSchema, 'foods');

export default Food;

