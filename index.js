import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import {
    authRoutes,
    dietPlanRoutes,
    fitnessDataRoutes,
    foodRoutes,
    mealRoutes,
    profileRoutes,
    weightRoutes,
    postRoutes,
    commentRoutes,
    likeRoutes,
    followRoutes,
    notificationPreferencesRoutes
} from './routes/index.js';

dotenv.config();

connectDB();

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/diet-plans', dietPlanRoutes);
app.use('/api/fitness-data', fitnessDataRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/weights', weightRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/notification-preferences', notificationPreferencesRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, console.log(`Server running on port ${PORT}`));
