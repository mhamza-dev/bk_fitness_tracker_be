import mongoose from 'mongoose';

const { Schema } = mongoose;

const notificationPreferencesSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    // Notification types
    pushNotifications: {
        type: Boolean,
        default: true,
    },
    emailNotifications: {
        type: Boolean,
        default: false,
    },
    // Reminder types
    stepReminders: {
        type: Boolean,
        default: true,
    },
    mealReminders: {
        type: Boolean,
        default: true,
    },
    workoutReminders: {
        type: Boolean,
        default: true,
    },
    weightReminders: {
        type: Boolean,
        default: false,
    },
    // Social updates
    socialUpdates: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Indexes
notificationPreferencesSchema.index({ userId: 1 });

const NotificationPreferences = mongoose.models.NotificationPreferences || mongoose.model('NotificationPreferences', notificationPreferencesSchema, 'notification_preferences');

export default NotificationPreferences;


