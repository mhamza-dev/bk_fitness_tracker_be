import mongoose from 'mongoose';

const { Schema } = mongoose;

const followSchema = new Schema({
    followerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    followingId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
}, {
    timestamps: true,
});

// Indexes
followSchema.index({ followerId: 1, followingId: 1 });
followSchema.index({ followingId: 1 });

// Compound unique index to prevent duplicate follows
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Validation: user cannot follow themselves
followSchema.pre('validate', function (next) {
    if (this.followerId.toString() === this.followingId.toString()) {
        this.invalidate('followingId', 'Cannot follow yourself');
    }
    next();
});

const Follow = mongoose.models.Follow || mongoose.model('Follow', followSchema);

export default Follow;

