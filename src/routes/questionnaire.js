import express from 'express';
import { Questionnaire } from '../models/questionnaire.js';
import { User } from '../models/user.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Submit new questionnaire
router.post('/', authenticate, async (req, res, next) => {
  try {
    const questionnaire = new Questionnaire({
      ...req.body,
      user: req.user._id
    });

    await questionnaire.save();

    // Add questionnaire to user's questionnaires array
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { questionnaires: questionnaire._id } }
    );

    res.status(201).json(questionnaire);
  } catch (error) {
    next(error);
  }
});

// Get user's questionnaires
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const questionnaires = await Questionnaire.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(questionnaires);
  } catch (error) {
    next(error);
  }
});

// Get specific questionnaire
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const questionnaire = await Questionnaire.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    res.json(questionnaire);
  } catch (error) {
    next(error);
  }
});

// Update questionnaire
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const questionnaire = await Questionnaire.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    // Only allow updates if status is pending
    if (questionnaire.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Cannot update questionnaire after review has started' 
      });
    }

    const allowedUpdates = [
      'projectName',
      'projectType',
      'businessDescription',
      'targetAudience',
      'keyFeatures',
      'budget',
      'timeline',
      'technicalRequirements',
      'additionalNotes'
    ];

    const updates = Object.keys(req.body)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    Object.assign(questionnaire, updates);
    await questionnaire.save();

    res.json(questionnaire);
  } catch (error) {
    next(error);
  }
});

// Delete questionnaire
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const questionnaire = await Questionnaire.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
      status: 'pending' // Only allow deletion of pending questionnaires
    });

    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found or cannot be deleted' });
    }

    // Remove questionnaire from user's questionnaires array
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { questionnaires: questionnaire._id } }
    );

    res.json({ message: 'Questionnaire deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Admin routes
router.get('/admin/all', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = status ? { status } : {};

    const questionnaires = await Questionnaire.find(query)
      .populate('user', 'email displayName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean()
      .exec();

    const total = await Questionnaire.countDocuments(query);

    // Transform the data to match the frontend expectations
    const transformedQuestionnaires = questionnaires.map(q => ({
      ...q,
      submittedBy: {
        _id: q.user._id,
        displayName: q.user.displayName,
        email: q.user.email
      },
      submittedAt: q.createdAt
    }));

    res.json({
      questionnaires: transformedQuestionnaires,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (error) {
    next(error);
  }
});

// Get specific questionnaire (admin)
router.get('/admin/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id)
      .populate('user', 'email displayName')
      .lean()
      .exec();

    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    // Transform the data to match frontend expectations
    const transformedQuestionnaire = {
      ...questionnaire,
      submittedBy: {
        _id: questionnaire.user._id,
        displayName: questionnaire.user.displayName,
        email: questionnaire.user.email
      },
      submittedAt: questionnaire.createdAt
    };

    res.json(transformedQuestionnaire);
  } catch (error) {
    next(error);
  }
});

// Admin update questionnaire status and feedback
router.patch('/admin/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { status, adminFeedback } = req.body;
    
    const questionnaire = await Questionnaire.findById(req.params.id);
    
    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    if (status) questionnaire.status = status;
    if (adminFeedback) {
      questionnaire.adminFeedback = {
        message: adminFeedback,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }

    await questionnaire.save();

    // Notify user about the update
    await User.findByIdAndUpdate(questionnaire.user, {
      $push: {
        notifications: {
          message: `Your questionnaire "${questionnaire.projectName}" has been ${status || 'updated'}.`,
          createdAt: Date.now()
        }
      }
    });

    res.json(questionnaire);
  } catch (error) {
    next(error);
  }
});

export default router; 