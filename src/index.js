import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import questionnaireRoutes from './routes/questionnaire.js';
import adminRoutes from './routes/admin.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate } from './middleware/auth.js';

// Initialize Firebase Admin
import { initializeFirebase } from './config/firebase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase
initializeFirebase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/questionnaire', authenticate, questionnaireRoutes);
app.use('/api/admin', authenticate, adminRoutes);

// Error handling
app.use(errorHandler);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
}); 