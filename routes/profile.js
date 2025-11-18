import express from 'express';
const router = express.Router();
import { auth } from '../middleware/index.js';
import {
    getProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    addAllergy,
    removeAllergy,
    addPhysicalIssue,
    removePhysicalIssue,
    updateWeightHeight
} from '../controllers/index.js';

// All routes are protected with auth middleware
router.get('/', auth, getProfile);
router.post('/', auth, createProfile);
router.put('/', auth, updateProfile);
router.delete('/', auth, deleteProfile);
router.post('/allergies', auth, addAllergy);
router.delete('/allergies', auth, removeAllergy);
router.post('/physical-issues', auth, addPhysicalIssue);
router.delete('/physical-issues', auth, removePhysicalIssue);
router.put('/weight-height', auth, updateWeightHeight);

export default router;

