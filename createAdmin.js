import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/user.js';

dotenv.config();

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert(process.env.FIREBASE_ADMIN_SDK_PATH)
});

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Admin user details
    const adminEmail = 'admin@kad.com';
    const adminPassword = 'admin123456';
    const adminDisplayName = 'Admin User';

    // Create user in Firebase
    const userRecord = await getAuth().createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: adminDisplayName
    });

    // Create admin user in MongoDB
    const adminUser = new User({
      firebaseUid: userRecord.uid,
      email: adminEmail,
      displayName: adminDisplayName,
      isAdmin: true
    });

    await adminUser.save();

    console.log('Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser(); 