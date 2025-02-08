import express from 'express';
import { User } from '../models/user.js';
import { Questionnaire } from '../models/questionnaire.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all users with pagination
router.get('/users', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (error) {
    next(error);
  }
});

// Get analytics data
router.get('/analytics', authenticate, isAdmin, async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalQuestionnaires,
      questionnairesStatusCount,
      recentQuestionnaires,
      userRegistrationStats
    ] = await Promise.all([
      User.countDocuments(),
      Questionnaire.countDocuments(),
      Questionnaire.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Questionnaire.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'email displayName'),
      User.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ])
    ]);

    res.json({
      totalUsers,
      totalQuestionnaires,
      questionnairesStatusCount: questionnairesStatusCount.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      recentQuestionnaires,
      userRegistrationStats
    });
  } catch (error) {
    next(error);
  }
});

// Update user role (make admin/remove admin)
router.patch('/users/:id/role', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { isAdmin: makeAdmin } = req.body;
    
    if (typeof makeAdmin !== 'boolean') {
      return res.status(400).json({ error: 'isAdmin must be a boolean value' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isAdmin: makeAdmin },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/users/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete all user's questionnaires
    await Questionnaire.deleteMany({ user: user._id });
    
    // Delete user
    await user.deleteOne();

    res.json({ message: 'User and associated data deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get user details with their questionnaires
router.get('/users/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-__v');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const questionnaires = await Questionnaire.find({ user: user._id })
      .sort({ createdAt: -1 });

    res.json({
      user,
      questionnaires
    });
  } catch (error) {
    next(error);
  }
});

export default router; 