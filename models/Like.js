import mongoose from 'mongoose';

const { Schema } = mongoose;

const likeSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Can like posts or comments
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        default: null,
    },
    commentId: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
    },
}, {
    timestamps: true,
});

// Indexes
likeSchema.index({ postId: 1 });
likeSchema.index({ commentId: 1 });

// Compound unique indexes to prevent duplicate likes
likeSchema.index({ userId: 1, postId: 1 }, { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { postId: { $ne: null } }
});

likeSchema.index({ userId: 1, commentId: 1 }, { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { commentId: { $ne: null } }
});

// Validation: either postId or commentId must be provided
likeSchema.pre('validate', function (next) {
    if (!this.postId && !this.commentId) {
        this.invalidate('postId', 'Either postId or commentId must be provided');
    }
    if (this.postId && this.commentId) {
        this.invalidate('postId', 'Cannot like both post and comment simultaneously');
    }
    next();
});

const Like = mongoose.models.Like || mongoose.model('Like', likeSchema);

export default Like;

