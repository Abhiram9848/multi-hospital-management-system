# Local Development Setup Guide

This guide will help you set up and run the Hospital Management System on your local machine.

## Prerequisites

1. **Node.js** (v16 or higher) - [Download from nodejs.org](https://nodejs.org/)
2. **MongoDB** (v5.0 or higher) - [Download from mongodb.com](https://www.mongodb.com/try/download/community)
3. **Git** - [Download from git-scm.com](https://git-scm.com/)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/Abhiram9848/multi-hospital-management-system.git
cd multi-hospital-management-system
```

### 2. Setup Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   - Copy the existing `.env` file or create a new one with:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/hospital_management
   
   # JWT Secret Key (change this to a secure secret)
   JWT_SECRET=your_super_secret_jwt_key_for_development
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

### 3. Setup Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### 4. Setup MongoDB

#### Option A: Local MongoDB Installation

1. Install MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service:
   - **Windows**: MongoDB should start automatically after installation
   - **macOS**: `brew services start mongodb/brew/mongodb-community`
   - **Linux**: `sudo systemctl start mongod`

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Update the `MONGODB_URI` in `backend/.env` with your Atlas connection string

### 5. Seed the Database (Optional)

To populate the database with sample data:

```bash
cd backend
npm run seed
```

## Running the Application

### Start the Backend Server

```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:5000`

### Start the Frontend Development Server

Open a new terminal:

```bash
cd frontend
npm start
```

The frontend will start on `http://localhost:3000`

## Verification

1. **Backend**: Visit `http://localhost:5000` - you should see a basic response
2. **Frontend**: Visit `http://localhost:3000` - you should see the application login page
3. **Database**: Check if MongoDB is running and the connection is successful (no error logs in backend terminal)

## Available Scripts

### Backend Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with auto-reload
- `npm run seed` - Seed the database with sample data

### Frontend Scripts

- `npm start` - Start the development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Default Login Credentials (After Seeding)

### Super Admin
- Email: superadmin@hospital.com
- Password: superadmin123

### Admin
- Email: admin@cityhospital.com
- Password: admin123

### Doctor
- Email: emily.davis@cityhospital.com
- Password: doctor123

### Patient
- Email: emma.johnson@email.com
- Password: patient123

## Troubleshooting

### MongoDB Connection Issues

1. **Error: connect ECONNREFUSED**
   - Make sure MongoDB is running
   - Check if the MongoDB URI in `.env` is correct
   - For Windows: Restart MongoDB service

2. **Database not found**
   - MongoDB will create the database automatically when the app first connects
   - Run the seed script to populate with sample data

### Port Issues

1. **Port 5000 already in use**
   - Change the PORT in `backend/.env` to a different port (e.g., 5001)
   - Update the frontend API calls if needed

2. **Port 3000 already in use**
   - The React dev server will automatically suggest a different port
   - Choose 'Y' when prompted

### Dependency Issues

1. **npm install fails**
   - Try deleting `node_modules` and `package-lock.json`, then run `npm install` again
   - Make sure you're using a compatible Node.js version

### Socket.io Connection Issues

1. **Real-time features not working**
   - Check browser console for WebSocket connection errors
   - Ensure backend server is running
   - Check for CORS issues in browser network tab

## Development Workflow

1. Start MongoDB
2. Start the backend server (`npm run dev` in backend directory)
3. Start the frontend server (`npm start` in frontend directory)
4. Make your changes
5. Test the functionality
6. Commit and push your changes

## Project Structure

```
hospital-management-system/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## Features Available

- User authentication (Login/Register)
- Role-based access control (Super Admin, Admin, Doctor, Patient)
- Hospital management
- Department management
- Appointment scheduling
- Real-time video calls
- Chat messaging
- Prescription management
- Analytics dashboard

## Need Help?

If you encounter any issues:
1. Check the troubleshooting section above
2. Look at the console/terminal logs for error messages
3. Make sure all prerequisites are installed correctly
4. Ensure MongoDB is running and accessible
