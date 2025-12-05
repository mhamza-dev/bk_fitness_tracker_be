import mongoose from 'mongoose';

const { Schema } = mongoose;

const subscriptionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    planId: {
        type: String,
        required: true,
    },
    planName: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'expired'],
        default: 'active',
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    endDate: {
        type: Date,
    },
    cancelledAt: {
        type: Date,
    },
    // Payment information (optional - can be stored separately)
    transactionId: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});

// Indexes
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function () {
    if (this.status !== 'active') return false;
    if (this.endDate && this.endDate < new Date()) return false;
    return true;
};

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema, 'subscriptions');

export default Subscription;

