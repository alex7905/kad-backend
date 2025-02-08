import express from 'express';
import { auth } from '../config/firebase.js';
import { User } from '../models/user.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    // Create user in Firebase
    const userRecord = await auth().createUser({
      email,
      password,
      displayName
    });

    // Create user in MongoDB
    const user = new User({
      firebaseUid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-__v')
      .populate('questionnaires');
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const allowedUpdates = ['displayName', 'profilePicture'];
    const updates = Object.keys(req.body)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Delete user account
router.delete('/profile', authenticate, async (req, res) => {
  try {
    // Delete from Firebase
    await auth().deleteUser(req.user.firebaseUid);
    
    // Delete from MongoDB
    await User.findByIdAndDelete(req.user._id);

    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router; 