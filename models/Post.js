import mongoose from 'mongoose';

const { Schema } = mongoose;

const postSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    // Post content
    caption: {
        type: String,
        trim: true,
        maxlength: [2200, 'Caption cannot exceed 2200 characters'],
    },
    images: {
        type: [String],
        default: [],
        validate: {
            validator: function (images) {
                return images.length <= 10;
            },
            message: 'Cannot upload more than 10 images'
        }
    },
    // Post metadata
    location: {
        type: String,
        trim: true,
    },
    tags: {
        type: [String],
        default: [],
    },
    // Engagement metrics
    likesCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    commentsCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    // Post type (for future expansion - could be workout, meal, progress, etc.)
    postType: {
        type: String,
        enum: ['general', 'workout', 'meal', 'progress', 'achievement'],
        default: 'general',
    },
    // Related data (optional links to other models)
    relatedWorkoutId: {
        type: Schema.Types.ObjectId,
        ref: 'FitnessData',
    },
    relatedMealId: {
        type: Schema.Types.ObjectId,
        ref: 'Meal',
    },
    // Privacy settings
    isPublic: {
        type: Boolean,
        default: true,
    },
    // Soft delete
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Indexes
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ postType: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ isPublic: 1, isDeleted: 1 });

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

export default Post;

