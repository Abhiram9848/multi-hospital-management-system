# 🏥 Hospital Management System

A comprehensive full-stack **Multi-Hospital Management System** built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring role-based authentication and management for SuperAdmin, Hospital, Admin, Doctor, and Patient users with complete hospital segregation and management.

## ✨ Features

### 🔐 Authentication & Authorization
- **5 User Roles**: SuperAdmin, Hospital, Admin, Doctor, Patient
- **Multi-Hospital Architecture**: Complete data segregation between hospitals
- **JWT-based Authentication**: Secure token-based login system
- **Role-based Access Control**: Different permissions for each user type
- **Protected Routes**: Frontend route protection based on user roles
- **Hospital-Specific Access**: Users can only access data from their assigned hospital

### 👥 User Management

#### **SuperAdmin** 🌐 (Single User - No Registration)
- **Complete System Control**: Full access to all system components across all hospitals
- **Hospital Management**: Create, update, delete hospitals and manage their subscriptions
- **Admin Assignment**: Assign and manage hospital administrators (one per hospital)
- **Global Analytics**: System-wide analytics across all hospitals
- **User Management**: Comprehensive user management across all hospitals
- **Security Management**: Monitor security logs, configure security policies, and manage access controls
- **Backup & Restore**: Automated and manual backup systems with restore capabilities
- **System Health Monitoring**: Real-time monitoring of database, server, and security status

#### **Hospital** 🏥 (Hospital-Level Access)
- **Hospital Dashboard**: Comprehensive hospital overview and statistics
- **Hospital Information**: View hospital details, capacity, and subscription status
- **User Statistics**: Monitor hospital's doctors, patients, and staff counts
- **Hospital Settings**: Manage hospital-specific configurations
- **Admin Contact**: Direct access to hospital administrator information

#### **Admin** 👨‍💼 (One per Hospital)
- **Hospital Operations**: Manage day-to-day hospital operations for their assigned hospital
- **Doctor Management**: Add and manage doctor accounts within their hospital
- **Patient Management**: View and manage patient records within their hospital
- **Department Management**: Manage hospital departments and assignments
- **Appointment Oversight**: Monitor and manage appointment scheduling within their hospital
- **Hospital-Specific Analytics**: View statistics and reports for their hospital only

#### **Doctor** 👨‍⚕️ (Hospital-Specific)
- **Appointment Management**: View and update appointment status within their hospital
- **Patient Records**: Access patient medical information during appointments (hospital-specific)
- **Schedule Management**: View daily and upcoming appointments
- **Prescription Management**: Add prescriptions and medical notes
- **Hospital Integration**: Access only patients and data within their assigned hospital

#### **Patient** 🏃‍♂️ (Hospital-Specific)
- **Appointment Booking**: Schedule appointments with doctors from their hospital
- **Medical History**: View past appointments and medical records within their hospital
- **Profile Management**: Update personal information and emergency contacts
- **Prescription Access**: View prescribed medications and instructions
- **Hospital Services**: Access services and information specific to their registered hospital

### 🏥 Multi-Hospital Management
- **Hospital Registration**: Complete hospital onboarding with detailed information
- **Hospital Profiles**: Comprehensive hospital information including capacity, specialties, and facilities
- **Subscription Management**: Different hospital plans (Basic, Premium, Enterprise)
- **Department Management**: Create and manage hospital-specific departments
- **Appointment System**: Hospital-specific appointment scheduling and management
- **User Profiles**: Comprehensive profiles for all user types with hospital associations
- **Dashboard Analytics**: Role-specific dashboards with relevant statistics
- **Data Segregation**: Complete separation of data between different hospitals
- **Admin Assignment**: One dedicated admin per hospital with full hospital management rights

### 💻 Modern Tech Stack
- **Frontend**: React.js with TypeScript, React Router for navigation
- **Backend**: Node.js with Express.js RESTful API
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Styling**: Custom CSS with responsive design

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hospital-management-system
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   
   Create a `.env` file in the backend directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/hospital_management
   JWT_SECRET=your_jwt_secret_key_here
   PORT=5000
   ```

5. **Start MongoDB**
   
   Make sure MongoDB is running on your system:
   ```bash
   # For local MongoDB installation
   mongod
   
   # Or use MongoDB Atlas connection string in .env
   ```

6. **Seed the Database** (Optional but recommended)
   ```bash
   cd backend
   npm run seed
   ```

7. **Start the Development Servers**
   
   **Backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```
   
   **Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm start
   ```

8. **Access the Application**
   
   Open your browser and navigate to: `http://localhost:3000`

## 🔑 Sample Login Credentials

After seeding the database, you can use these credentials:

### **System Administrator**
| Role | Email | Password | Notes |
|------|-------|----------|-------|
| **Super Admin** | superadmin@hospital.com | password123 | Global system access, manages all hospitals |

### **Hospital Logins** (Hospital Dashboard Access)
| Hospital | Hospital Email | Admin Email | Password | Notes |
|----------|----------------|-------------|----------|-------|
| **City General Hospital** | admin@citygeneral.com | admin@citygeneral.com | password123 | Hospital management dashboard |
| **Metro Health Center** | contact@metrohealth.com | admin@metrohealth.com | password123 | Hospital management dashboard |

### **Direct User Logins**
| Role | Email | Password | Hospital | Notes |
|------|-------|----------|----------|-------|
| **City General Admin** | admin@citygeneral.com | password123 | City General Hospital | Admin dashboard access |
| **Metro Health Admin** | admin@metrohealth.com | password123 | Metro Health Center | Admin dashboard access |
| **Doctor (City General)** | sarah.johnson@citygeneral.com | password123 | City General Hospital | Doctor dashboard access |
| **Doctor (Metro Health)** | emily.davis@metrohealth.com | password123 | Metro Health Center | Doctor dashboard access |
| **Patient (City General)** | alice.smith@email.com | password123 | City General Hospital | Patient dashboard access |
| **Patient (Metro Health)** | emma.johnson@email.com | password123 | Metro Health Center | Patient dashboard access |

## 📁 Project Structure

```
hospital-management-system/
├── backend/
│   ├── models/          # MongoDB schemas
│   │   ├── User.js      # User model with hospital associations
│   │   ├── Hospital.js  # Hospital model with comprehensive details
│   │   ├── Department.js
│   │   └── Appointment.js
│   ├── routes/          # API endpoints
│   │   ├── auth.js      # Authentication routes
│   │   ├── users.js     # User management
│   │   ├── hospitals.js # Hospital CRUD operations
│   │   ├── appointments.js
│   │   ├── departments.js
│   │   └── superadmin.js
│   ├── middleware/      # Authentication middleware
│   │   └── auth.js      # JWT auth + role-based permissions
│   ├── utils/          # Utility functions
│   ├── server.js       # Express server setup
│   ├── seed.js         # Database seeding script (multi-hospital)
│   └── .env            # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/           # Login/Register components
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── HospitalLogin.tsx  # Hospital-specific login
│   │   │   │   └── Register.tsx
│   │   │   ├── Dashboards/     # Role-specific dashboards
│   │   │   │   ├── SuperAdminDashboard.tsx
│   │   │   │   ├── HospitalDashboard.tsx  # Hospital management
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── DoctorDashboard.tsx
│   │   │   │   └── PatientDashboard.tsx
│   │   │   ├── HomePage.tsx    # Landing page with hospital option
│   │   │   └── ProtectedRoute.tsx
│   │   ├── App.tsx             # Main app component
│   │   └── index.tsx          # React entry point
│   └── public/
└── README.md
```

## 🔌 API Endpoints

### Authentication Routes
- `POST /api/auth/register` - User registration (hospital-specific)
- `POST /api/auth/login` - User login (role-based)
- `GET /api/auth/profile` - Get user profile

### Hospital Management (SuperAdmin/Hospital Admin)
- `GET /api/hospitals` - Get all hospitals (SuperAdmin only)
- `GET /api/hospitals/:id` - Get hospital by ID
- `POST /api/hospitals` - Create new hospital (SuperAdmin only)
- `PUT /api/hospitals/:id` - Update hospital
- `DELETE /api/hospitals/:id` - Delete hospital (SuperAdmin only)
- `PUT /api/hospitals/:id/assign-admin` - Assign admin to hospital (SuperAdmin only)
- `PUT /api/hospitals/:id/remove-admin` - Remove admin from hospital (SuperAdmin only)
- `GET /api/hospitals/:id/stats` - Get hospital statistics

### User Management (Hospital-Specific)
- `GET /api/users` - Get all users (filtered by hospital for admins)
- `GET /api/users/doctors` - Get doctors (hospital-specific)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin/SuperAdmin)

### Appointments (Hospital-Specific)
- `POST /api/appointments` - Create appointment (within hospital)
- `GET /api/appointments` - Get appointments (filtered by hospital and user role)
- `GET /api/appointments/:id` - Get appointment by ID
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Departments (Hospital-Specific)
- `POST /api/departments` - Create department (Admin/SuperAdmin, hospital-specific)
- `GET /api/departments` - Get departments (hospital-specific)
- `GET /api/departments/:id` - Get department by ID
- `PUT /api/departments/:id` - Update department (Admin/SuperAdmin)
- `DELETE /api/departments/:id` - Delete department (SuperAdmin)

### SuperAdmin Routes
- `GET /api/superadmin/stats` - System-wide statistics
- `GET /api/superadmin/hospitals` - All hospitals overview
- `POST /api/superadmin/hospitals` - Create new hospital

## 🎨 User Interface

### Home Page
- **Role Selection**: 5 distinct cards for each user role (SuperAdmin, Hospital, Admin, Doctor, Patient)
- **Multi-Hospital Support**: Dedicated hospital login option
- **Responsive Design**: Works on desktop and mobile devices
- **Intuitive Navigation**: Clear call-to-action buttons

### Authentication
- **Role-specific Forms**: Tailored registration forms for each user type
- **Hospital Login**: Dual authentication system (hospital email + admin credentials)
- **Validation**: Form validation and error handling
- **Security**: Password hashing and secure token storage
- **Hospital Association**: Automatic hospital assignment during registration

### Dashboards
- **SuperAdmin**: System-wide analytics, hospital management, global user management
- **Hospital**: Hospital overview, statistics, capacity management, subscription details
- **Admin**: Hospital-specific operations, staff management, reporting within hospital
- **Doctor**: Hospital-specific appointment management, patient records, schedule
- **Patient**: Hospital-specific appointments, medical history, profile

## 🛡️ Security Features

- **Password Hashing**: bcrypt for secure password storage
- **JWT Authentication**: Stateless authentication with tokens
- **Role-based Authorization**: API endpoints protected by user roles
- **Hospital Data Segregation**: Complete data isolation between hospitals
- **Input Validation**: Server-side validation for all inputs
- **Protected Routes**: Frontend route protection
- **Hospital-Specific Access Control**: Users can only access their assigned hospital's data

## 🔧 Available Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with sample data

### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 🌟 Features to Implement

This is a foundational multi-hospital system that can be extended with:

- **Hospital Management Enhancement**: 
  - ✅ **Hospital CRUD operations in SuperAdmin dashboard** (Recently Added)
  - Advanced hospital subscription management
  - Hospital-specific configurations and settings
- **Advanced Appointment Booking**: Calendar integration, time slot management
- **Medical Records**: Enhanced patient history, prescriptions, lab results
- **Billing System**: Hospital-specific invoice generation, payment processing
- **Notifications**: Email/SMS notifications for appointments
- **Reporting**: Advanced analytics and reporting features per hospital
- **File Upload**: Medical documents and image uploads
- **Real-time Chat**: Communication between doctors and patients within hospitals
- **Inter-Hospital Features**: Patient referrals, data sharing between hospitals
- **Mobile App**: Hospital-specific mobile applications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Known Issues

- Currently using local storage for token management (consider implementing refresh tokens)
- File upload functionality not implemented
- Email notifications not configured
- Advanced hospital-specific settings not yet implemented

## 🆕 Recent Updates (Multi-Hospital Implementation)

### **Major Changes Made:**

#### **1. Multi-Hospital Architecture**
- **Complete system redesign** to support multiple hospitals
- **Hospital Model**: Comprehensive hospital schema with registration, licensing, capacity, and subscription management
- **Data Segregation**: Complete separation of data between different hospitals
- **User-Hospital Associations**: All users (admins, doctors, patients) are now associated with specific hospitals

#### **2. New Hospital Login System**
- **Hospital Dashboard**: Dedicated login and dashboard for hospital-level management
- **Dual Authentication**: Hospital login requires both hospital email and admin credentials
- **Hospital Management Interface**: Overview of hospital statistics, user counts, and settings

#### **3. Updated User Roles & Permissions**
- **SuperAdmin**: Now manages multiple hospitals, can create/delete hospitals, assign admins
- **Hospital Role**: New role for hospital-level dashboard access
- **Admin**: One per hospital, manages hospital-specific operations only
- **Doctor & Patient**: Hospital-specific access, can only interact within their assigned hospital

#### **4. Enhanced Database Schema**
- **Hospital Model**: Added with comprehensive fields (capacity, specialties, subscription, etc.)
- **User Model**: Updated with `hospitalId` field for hospital associations
- **Data Relationships**: Proper linking between users and hospitals

#### **5. Updated Seeding & Sample Data**
- **Two Sample Hospitals**: City General Hospital and Metro Health Center
- **Hospital-Specific Users**: All users are properly assigned to hospitals
- **Realistic Test Data**: Complete hospital information with different plans and capacities

#### **6. Frontend Enhancements**
- **Updated Home Page**: Added hospital login option (purple card)
- **Hospital Login Component**: New authentication flow for hospitals
- **Hospital Dashboard**: Complete hospital management interface
- **Updated Routing**: New routes for hospital login and dashboard

#### **7. Backend API Enhancements**
- **Hospital Management API**: Complete CRUD operations for hospitals
- **Hospital Statistics**: API endpoints for hospital-specific analytics
- **Updated Authentication**: Enhanced middleware for hospital-specific access control
- **Admin Assignment**: API for assigning/removing hospital administrators

### **Migration Notes:**
- **Existing Data**: Old users will need to be reassigned to hospitals
- **New Installation**: Use `npm run seed` to populate with sample multi-hospital data
- **Breaking Changes**: Authentication flow updated for hospital associations

## 📧 Support

For support and questions, please create an issue in the repository or contact the development team.

---

**Built with ❤️ using the MERN Stack**
