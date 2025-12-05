import mongoose from 'mongoose';

const { Schema } = mongoose;

const allergySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        default: 'moderate',
    },
    notes: {
        type: String,
        trim: true,
    },
}, { _id: false });

const physicalIssueSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ['chronic', 'temporary', 'condition'],
        default: 'condition',
    },
    notes: {
        type: String,
        trim: true,
    },
}, { _id: false });

const profileSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    // Personal information
    dateOfBirth: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return value <= new Date();
            },
            message: 'Date of birth cannot be in the future',
        },
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    // Physical attributes
    weight: {
        type: Number,
        required: true,
        min: [1, 'Weight must be greater than 0'],
        max: [500, 'Weight must be less than 500 kg'],
    },
    height: {
        type: Number,
        required: true,
        min: [50, 'Height must be greater than 50 cm'],
        max: [300, 'Height must be less than 300 cm'],
    },
    weightUnit: {
        type: String,
        enum: ['kg', 'lbs'],
        default: 'kg',
    },
    heightUnit: {
        type: String,
        enum: ['cm', 'ft', 'inches'],
        default: 'cm',
    },
    bmi: {
        type: Number,
    },
    avatar: {
        type: String,
        trim: true,
    },
    // Health information
    allergies: {
        type: [allergySchema],
        default: [],
    },
    physicalIssues: {
        type: [physicalIssueSchema],
        default: [],
    },
    // Activity and preferences
    activityLevel: {
        type: String,
        enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'],
        default: 'moderately_active',
    },
    dietaryPreferences: {
        type: [String],
        enum: ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'keto', 'paleo', 'mediterranean', 'none'],
        default: [],
    },
    healthGoals: {
        type: [String],
        enum: ['weight_loss', 'weight_gain', 'muscle_gain', 'maintenance', 'improve_health', 'manage_condition'],
        default: [],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
});

// Indexes
profileSchema.index({ userId: 1 });

// Pre-save middleware to calculate BMI
profileSchema.pre('save', function (next) {
    if (this.isModified('weight') || this.isModified('height') || this.isModified('weightUnit') || this.isModified('heightUnit')) {
        const heightInMeters = this.heightUnit === 'cm'
            ? this.height / 100
            : this.heightUnit === 'ft'
                ? this.height * 0.3048
                : this.height * 0.0254;

        const weightInKg = this.weightUnit === 'kg' ? this.weight : this.weight * 0.453592;

        this.bmi = weightInKg / (heightInMeters * heightInMeters);
    }
    next();
});

// Virtual for age calculation
profileSchema.virtual('age').get(function () {
    if (!this.dateOfBirth) return null;

    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
});

const Profile = mongoose.models.Profile || mongoose.model('Profile', profileSchema, 'profiles');

export default Profile;

