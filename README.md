# KAD Software Backend API

Backend API for the KAD Software Company Website built with Node.js, Express, and MongoDB.

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- Firebase Admin SDK
- JWT Authentication

## Prerequisites

- Node.js 18+
- MongoDB
- Firebase Admin SDK credentials

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
FIREBASE_ADMIN_SDK_PATH=path_to_firebase_admin_sdk.json
FIREBASE_DATABASE_URL=your_firebase_database_url
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Place your Firebase Admin SDK JSON file in the root directory

3. Create the `.env` file with required variables

4. Create an admin user:
```bash
node createAdmin.js
```

5. Start the development server:
```bash
npm run dev
```

## API Routes

### Auth Routes
- `POST /api/auth/register` - Register new user
- `GET /api/auth/profile` - Get user profile
- `PATCH /api/auth/profile` - Update user profile

### Questionnaire Routes
- `POST /api/questionnaire` - Submit questionnaire
- `GET /api/questionnaire/my` - Get user's questionnaires
- `GET /api/questionnaire/:id` - Get specific questionnaire
- `PATCH /api/questionnaire/:id` - Update questionnaire

### Admin Routes
- `GET /api/admin/users` - Get all users
- `GET /api/admin/analytics` - Get analytics data
- `PATCH /api/admin/users/:id/role` - Update user role
- `GET /api/admin/users/:id` - Get user details

## Deployment

This backend is configured for deployment on Render. Make sure to:

1. Add all environment variables in Render's dashboard
2. Set the build command to `npm install`
3. Set the start command to `npm start`
4. Add the Firebase Admin SDK JSON content as an environment variable

## Security

- CORS configured for frontend domain
- Rate limiting implemented
- JWT authentication
- Firebase Admin SDK authentication
- Request validation with Yup
- Helmet for security headers 