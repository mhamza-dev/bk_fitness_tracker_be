import mongoose from 'mongoose';

const { Schema } = mongoose;

const commentSchema = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Comment content
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    // Reply to another comment (for nested comments)
    parentCommentId: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
    },
    // Engagement
    likesCount: {
        type: Number,
        default: 0,
        min: 0,
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
commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ parentCommentId: 1 });

const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

export default Comment;

