import { auth } from '../config/firebase.js';
import { User } from '../models/user.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the Firebase token
    const decodedToken = await auth().verifyIdToken(token);
    
    // Get user from database
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    // If user doesn't exist in MongoDB but exists in Firebase, create them
    if (!user) {
      // Get user details from Firebase
      const firebaseUser = await auth().getUser(decodedToken.uid);
      
      // Create user in MongoDB
      user = new User({
        firebaseUid: decodedToken.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        isAdmin: firebaseUser.email === 'admin@kad.com' // Make admin@kad.com an admin
      });
      
      await user.save();
    }

    // Attach user to request object
    req.user = user;
    req.firebaseUser = decodedToken;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 