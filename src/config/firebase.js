import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import dotenv from 'dotenv';

dotenv.config();

let firebaseApp;

export const initializeFirebase = () => {
  try {
    if (!firebaseApp) {
      firebaseApp = initializeApp({
        credential: cert(process.env.FIREBASE_ADMIN_SDK_PATH),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
      
      console.log('Firebase Admin SDK initialized successfully');
    }
    return firebaseApp;
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
};

export const auth = () => getAuth(firebaseApp);
export const db = () => getFirestore(firebaseApp);
export const realtime = () => getDatabase(firebaseApp); 