import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
    // Authentication fields
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false,
    },
    // Basic information
    name: {
        type: String,
        trim: true,
    },
    // Account status
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // Timestamps
    lastLogin: {
        type: Date,
    },
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            return ret;
        },
    },
});

// Indexes
userSchema.index({ isActive: 1 });

// Static method to find user by email
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');

export default User;
