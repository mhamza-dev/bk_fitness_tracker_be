import mongoose from 'mongoose';

const { Schema } = mongoose;

const followSchema = new Schema({
    followerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    followingId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

// Indexes
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

const Follow = mongoose.models.Follow || mongoose.model('Follow', followSchema, 'follows');

export default Follow;

