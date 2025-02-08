import express from 'express';
import { User } from '../models/user.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user notifications
router.get('/notifications', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('notifications')
      .sort({ 'notifications.createdAt': -1 });

    res.json(user.notifications);
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch('/notifications/:notificationId', authenticate, async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { 
        _id: req.user._id,
        'notifications._id': req.params.notificationId
      },
      {
        $set: {
          'notifications.$.read': true
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(user.notifications);
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete('/notifications/:notificationId', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: {
          notifications: { _id: req.params.notificationId }
        }
      },
      { new: true }
    );

    res.json(user.notifications);
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.post('/notifications/mark-all-read', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'notifications.$[].read': true
        }
      },
      { new: true }
    );

    res.json(user.notifications);
  } catch (error) {
    next(error);
  }
});

// Get unread notifications count
router.get('/notifications/unread-count', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const unreadCount = user.notifications.filter(n => !n.read).length;

    res.json({ unreadCount });
  } catch (error) {
    next(error);
  }
});

// Update last login
router.post('/update-last-login', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { lastLogin: Date.now() },
      { new: true }
    );

    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router; 