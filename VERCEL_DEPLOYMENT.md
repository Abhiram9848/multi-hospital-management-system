# Vercel Deployment Guide

This guide will help you deploy your Hospital Management System to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. MongoDB Atlas account for production database
3. Your project code pushed to GitHub/GitLab/Bitbucket

## Environment Variables Setup

### Required Environment Variables for Backend

You need to set these in Vercel dashboard under your project settings:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hospital_management
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=production
```

### Frontend Environment Variables

The frontend will automatically use the production configuration when deployed.

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com) and log in
   - Click "Import Project"
   - Connect your Git repository
   - Select your hospital management system repository

2. **Configure Project**:
   - Framework Preset: Other
   - Root Directory: Leave empty (.)
   - Build Command: `npm run build` (Vercel will detect and run both frontend and backend builds)
   - Output Directory: `frontend/build`

3. **Add Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add the following variables:
     ```
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hospital_management
     JWT_SECRET=your_super_secret_jwt_key_here
     NODE_ENV=production
     ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project root**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new one
   - Set environment variables when prompted

## Important Configuration Files Added

1. **`vercel.json`** - Main configuration file that tells Vercel how to build and route your application
2. **`backend/api/index.js`** - Serverless function entry point for the backend
3. **`frontend/src/config/api.ts`** - Centralized API configuration
4. **`frontend/src/services/apiService.ts`** - API service with proper base URL handling
5. **`frontend/.env.production`** - Production environment variables

## Database Setup

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist IP addresses (or use 0.0.0.0/0 for all IPs)
5. Get your connection string and add it to Vercel environment variables

### Seed Data (Optional)

After deployment, you can seed your database by:
1. Running the seed script locally with production MongoDB URI
2. Or creating an API endpoint to seed data in production

## Post-Deployment Configuration

### Update Frontend URLs

After deployment, update the following in your Vercel environment variables:
- Replace `your-app-name` in `frontend/.env.production` with your actual Vercel app name
- Your Vercel URL will be something like: `https://hospital-management-system-xxx.vercel.app`

### Socket.io Configuration

The Socket.io configuration has been updated to work with Vercel's serverless functions. However, note that:
- Real-time features may have limitations on serverless platforms
- Consider using a dedicated Socket.io service for production if you need persistent connections

## Troubleshooting

### Common Issues

1. **Environment Variables Not Working**:
   - Make sure all environment variables are set in Vercel dashboard
   - Redeploy after adding new environment variables

2. **API Routes Not Working**:
   - Check that `vercel.json` is in the root directory
   - Verify the routes configuration in `vercel.json`

3. **Database Connection Issues**:
   - Verify MongoDB Atlas connection string
   - Check that IP addresses are whitelisted
   - Ensure database user has proper permissions

4. **Build Failures**:
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are listed in `package.json`
   - Verify that both frontend and backend build successfully locally

### Debugging

1. **Check Function Logs**:
   - Go to Vercel dashboard → Your Project → Functions
   - View logs for debugging API issues

2. **Test API Endpoints**:
   - Use the Vercel URL + `/api/health` to test if backend is working
   - Example: `https://your-app.vercel.app/api/health`

## Performance Considerations

1. **Cold Starts**: Serverless functions may have cold start delays
2. **Timeout Limits**: Vercel has execution time limits for serverless functions
3. **Memory Limits**: Monitor memory usage in function logs
4. **Database Connections**: Optimize database connection handling for serverless

## Production Checklist

- [ ] MongoDB Atlas database configured
- [ ] All environment variables set in Vercel
- [ ] JWT secret is secure and different from development
- [ ] API endpoints are working
- [ ] Frontend is connecting to production API
- [ ] Socket.io connections are working
- [ ] Authentication flow is working
- [ ] File uploads (if any) are configured
- [ ] Error monitoring is set up (optional)

## Support

If you encounter issues:
1. Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. Review function logs in Vercel dashboard
3. Test API endpoints individually
4. Verify environment variables are correctly set
