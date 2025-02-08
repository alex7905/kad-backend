import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  questionnaires: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Questionnaire'
  }],
  notifications: [{
    message: String,
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1, firebaseUid: 1 });

// Method to safely return user data without sensitive information
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.__v;
  return user;
};

export const User = mongoose.model('User', userSchema); 