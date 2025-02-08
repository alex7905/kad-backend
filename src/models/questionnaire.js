import mongoose from 'mongoose';

const questionnaireSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  projectType: {
    type: String,
    required: true,
    enum: ['web', 'mobile', 'desktop', 'other']
  },
  businessDescription: {
    type: String,
    required: true
  },
  targetAudience: {
    type: String,
    required: true
  },
  keyFeatures: [{
    type: String,
    required: true
  }],
  budget: {
    type: Number,
    required: true
  },
  timeline: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  technicalRequirements: {
    frontend: [{
      type: String
    }],
    backend: [{
      type: String
    }],
    database: [{
      type: String
    }],
    hosting: [{
      type: String
    }]
  },
  additionalNotes: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'in_progress', 'completed'],
    default: 'pending'
  },
  adminFeedback: {
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for faster queries
questionnaireSchema.index({ user: 1, status: 1 });
questionnaireSchema.index({ createdAt: -1 });

export const Questionnaire = mongoose.model('Questionnaire', questionnaireSchema); 