import { NotificationPreferences } from '../models/index.js';

// @route   GET /api/notification-preferences
// @desc    Get notification preferences for the authenticated user
// @access  Private
export const getNotificationPreferences = async (req, res) => {
    try {
        let preferences = await NotificationPreferences.findOne({ userId: req.user.id });

        // If no preferences exist, return default preferences
        if (!preferences) {
            preferences = {
                userId: req.user.id,
                pushNotifications: true,
                emailNotifications: false,
                stepReminders: true,
                mealReminders: true,
                workoutReminders: true,
                weightReminders: false,
                socialUpdates: true,
            };
        }

        res.json(preferences);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   POST /api/notification-preferences
// @desc    Create notification preferences for the authenticated user
// @access  Private
export const createNotificationPreferences = async (req, res) => {
    try {
        // Check if preferences already exist
        const existing = await NotificationPreferences.findOne({ userId: req.user.id });
        if (existing) {
            return res.status(400).json({ msg: 'Notification preferences already exist. Use PUT to update instead.' });
        }

        const {
            pushNotifications,
            emailNotifications,
            stepReminders,
            mealReminders,
            workoutReminders,
            weightReminders,
            socialUpdates
        } = req.body;

        const preferences = new NotificationPreferences({
            userId: req.user.id,
            pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
            emailNotifications: emailNotifications !== undefined ? emailNotifications : false,
            stepReminders: stepReminders !== undefined ? stepReminders : true,
            mealReminders: mealReminders !== undefined ? mealReminders : true,
            workoutReminders: workoutReminders !== undefined ? workoutReminders : true,
            weightReminders: weightReminders !== undefined ? weightReminders : false,
            socialUpdates: socialUpdates !== undefined ? socialUpdates : true,
        });

        await preferences.save();
        res.status(201).json(preferences);
    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Notification preferences already exist for this user' });
        }
        res.status(500).send('Server error');
    }
};

// @route   PUT /api/notification-preferences
// @desc    Update notification preferences for the authenticated user
// @access  Private
export const updateNotificationPreferences = async (req, res) => {
    try {
        const {
            pushNotifications,
            emailNotifications,
            stepReminders,
            mealReminders,
            workoutReminders,
            weightReminders,
            socialUpdates
        } = req.body;

        let preferences = await NotificationPreferences.findOne({ userId: req.user.id });

        if (!preferences) {
            // Create if doesn't exist
            preferences = new NotificationPreferences({
                userId: req.user.id,
                pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
                emailNotifications: emailNotifications !== undefined ? emailNotifications : false,
                stepReminders: stepReminders !== undefined ? stepReminders : true,
                mealReminders: mealReminders !== undefined ? mealReminders : true,
                workoutReminders: workoutReminders !== undefined ? workoutReminders : true,
                weightReminders: weightReminders !== undefined ? weightReminders : false,
                socialUpdates: socialUpdates !== undefined ? socialUpdates : true,
            });
        } else {
            // Update existing preferences
            if (pushNotifications !== undefined) preferences.pushNotifications = pushNotifications;
            if (emailNotifications !== undefined) preferences.emailNotifications = emailNotifications;
            if (stepReminders !== undefined) preferences.stepReminders = stepReminders;
            if (mealReminders !== undefined) preferences.mealReminders = mealReminders;
            if (workoutReminders !== undefined) preferences.workoutReminders = workoutReminders;
            if (weightReminders !== undefined) preferences.weightReminders = weightReminders;
            if (socialUpdates !== undefined) preferences.socialUpdates = socialUpdates;
        }

        await preferences.save();
        res.json(preferences);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   DELETE /api/notification-preferences
// @desc    Delete notification preferences for the authenticated user
// @access  Private
export const deleteNotificationPreferences = async (req, res) => {
    try {
        const preferences = await NotificationPreferences.findOne({ userId: req.user.id });

        if (!preferences) {
            return res.status(404).json({ msg: 'Notification preferences not found' });
        }

        await preferences.deleteOne();
        res.json({ msg: 'Notification preferences removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


