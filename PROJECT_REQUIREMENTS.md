# Hospital Management System - Project Requirements

## System Requirements

### Minimum System Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, or Ubuntu 18.04+
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 5GB free space
- **Network**: Stable internet connection for video calls

### Software Prerequisites

#### Core Requirements
- **Node.js**: Version 16.x or higher
- **npm**: Version 8.x or higher (comes with Node.js)
- **MongoDB**: Version 5.0+ (local installation or MongoDB Atlas)
- **Git**: Latest version for version control

#### Optional but Recommended
- **MongoDB Compass**: GUI for MongoDB management
- **Postman**: API testing and development
- **VS Code**: Recommended IDE with extensions:
  - ES7+ React/Redux/React-Native snippets
  - TypeScript Importer
  - MongoDB for VS Code
  - Thunder Client (API testing)

## Technology Stack

### Backend Dependencies
```json
{
  "bcryptjs": "^3.0.2",           // Password hashing
  "cors": "^2.8.5",               // Cross-origin resource sharing
  "dotenv": "^17.2.0",            // Environment variables
  "express": "^5.1.0",            // Web framework
  "jsonwebtoken": "^9.0.2",       // JWT authentication
  "mongoose": "^8.16.4",          // MongoDB ODM
  "nodemon": "^3.1.10",           // Development auto-restart
  "peer": "^1.0.2",               // Peer-to-peer connections
  "recorder-js": "^1.0.7",        // Audio recording
  "simple-peer": "^9.11.1",       // WebRTC wrapper
  "socket.io": "^4.8.1"           // Real-time communication
}
```

### Frontend Dependencies
```json
{
  "@testing-library/dom": "^10.4.0",
  "@testing-library/jest-dom": "^6.6.3",
  "@testing-library/react": "^16.3.0",
  "@testing-library/user-event": "^13.5.0",
  "@types/jest": "^27.5.2",
  "@types/node": "^16.18.126",
  "@types/react": "^19.1.8",
  "@types/react-dom": "^19.1.6",
  "axios": "^1.11.0",             // HTTP client
  "buffer": "^6.0.3",             // Buffer polyfill
  "microsoft-cognitiveservices-speech-sdk": "^1.45.0",  // Speech recognition
  "react": "^19.1.0",             // UI framework
  "react-dom": "^19.1.0",         // React DOM bindings
  "react-router-dom": "^7.7.0",   // Client-side routing
  "react-scripts": "5.0.1",       // React build tools
  "recordrtc": "^5.6.2",          // Recording library
  "simple-peer": "^9.11.1",       // WebRTC wrapper
  "socket.io-client": "^4.8.1",   // Real-time client
  "stream-browserify": "^3.0.0",  // Stream polyfill
  "typescript": "^4.9.5",         // Type checking
  "util": "^0.12.5",              // Utilities polyfill
  "web-vitals": "^2.1.4"          // Performance metrics
}
```

### Development Dependencies
```json
{
  "@craco/craco": "^7.1.0",       // Create React App configuration
  "@types/simple-peer": "^9.11.8", // TypeScript definitions
  "process": "^0.11.10",          // Process polyfill
  "react-app-rewired": "^2.2.1"   // Override CRA configuration
}
```

## Browser Requirements

### Supported Browsers
- **Chrome**: Version 90+ (recommended for video calls)
- **Firefox**: Version 88+
- **Safari**: Version 14+
- **Edge**: Version 90+

### Required Browser Features
- WebRTC support (for video calls)
- LocalStorage
- WebSocket support
- MediaDevices API (camera/microphone access)
- File API (for file uploads)

## Network Requirements

### Ports
- **Frontend**: Port 3000 (development)
- **Backend**: Port 5000
- **MongoDB**: Port 27017 (if running locally)

### Firewall Settings
- Allow incoming connections on port 3000 and 5000
- For video calls, ensure WebRTC traffic is not blocked
- STUN servers should be accessible (Google's public STUN servers)

## Environment Variables

### Required Backend Environment Variables (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/hospital_management

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Optional Environment Variables
```env
# MongoDB Atlas (if using cloud database)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hospital_management

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# File Upload (if using cloud storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Installation Requirements

### Step 1: Install Node.js
Download and install from [nodejs.org](https://nodejs.org/)

### Step 2: Install MongoDB
- **Option A**: Local installation from [mongodb.com](https://www.mongodb.com/try/download/community)
- **Option B**: Use MongoDB Atlas (cloud) at [mongodb.com/atlas](https://www.mongodb.com/atlas)

### Step 3: Clone and Setup Project
```bash
# Clone repository
git clone <repository-url>
cd hospital-management-system

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 4: Configure Environment
```bash
# Create environment file
cd backend
cp .env.example .env
# Edit .env with your configuration
```

### Step 5: Setup Database
```bash
# Run database seeder (optional)
cd backend
npm run seed
```

## Performance Requirements

### Minimum Performance Targets
- **Page Load Time**: < 3 seconds
- **API Response Time**: < 500ms
- **Video Call Latency**: < 300ms
- **Database Query Time**: < 100ms

### Recommended Hardware for Development
- **CPU**: Multi-core processor (Intel i5/AMD Ryzen 5 or better)
- **RAM**: 16GB for comfortable development
- **Storage**: SSD recommended for faster build times
- **Network**: Broadband connection for video call testing

## Security Requirements

### Authentication
- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control (Patient, Doctor, Admin, SuperAdmin)

### Data Protection
- HTTPS in production
- Input validation and sanitization
- SQL injection protection through Mongoose ODM
- XSS protection through proper data handling

### Privacy Compliance
- Secure handling of medical data
- User consent for camera/microphone access
- Data encryption at rest and in transit

## Deployment Requirements

### Production Environment
- **Web Server**: Nginx or Apache (reverse proxy)
- **Process Manager**: PM2 for Node.js applications
- **Database**: MongoDB Atlas or self-hosted MongoDB cluster
- **SSL Certificate**: Let's Encrypt or commercial SSL
- **CDN**: CloudFlare or AWS CloudFront (optional)

### Cloud Deployment Options
- **Heroku**: Easy deployment with add-ons
- **AWS**: EC2, RDS, S3 for full control
- **Vercel**: Frontend deployment (with API routes)
- **DigitalOcean**: App Platform or Droplets
- **Google Cloud**: App Engine or Compute Engine

## Development Tools

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "mongodb.mongodb-vscode"
  ]
}
```

### Testing Requirements
- **Frontend**: React Testing Library, Jest
- **Backend**: Jest, Supertest (for API testing)
- **E2E Testing**: Cypress or Playwright (optional)

## Video Call Requirements

### WebRTC Dependencies
- **STUN Servers**: Google's public STUN servers
- **Peer Connection**: simple-peer library
- **Signaling**: Socket.io for real-time communication

### Media Requirements
- **Camera Access**: getUserMedia API
- **Audio Processing**: Web Audio API
- **Recording**: RecordRTC library
- **Streaming**: MediaStream API

## Additional Features

### Optional Integrations
- **Email Service**: SendGrid, Mailgun, or SMTP
- **SMS Service**: Twilio for appointment reminders
- **Payment Gateway**: Stripe or PayPal for billing
- **File Storage**: AWS S3 or Cloudinary for documents
- **Analytics**: Google Analytics for usage tracking

### Accessibility Requirements
- **WCAG 2.1 AA Compliance**
- **Screen Reader Support**
- **Keyboard Navigation**
- **High Contrast Mode Support**
- **Responsive Design** (Mobile-first approach)

---

## Quick Start Commands

```bash
# Start backend server
cd backend && npm start

# Start frontend development server
cd frontend && npm start

# Run both servers concurrently (if you have concurrently installed)
npm run dev

# Build for production
cd frontend && npm run build
```

## Support and Documentation
- **Technical Documentation**: Available in `/docs` folder
- **API Documentation**: Available at `/api/docs` (when server is running)
- **Video Call Setup**: See `VIDEO_CALL_SETUP.md`
- **Troubleshooting**: See `TROUBLESHOOTING.md`
