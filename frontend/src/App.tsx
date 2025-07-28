import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import HospitalLogin from './components/Auth/HospitalLogin';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminDashboard from './components/Dashboards/SuperAdminDashboard';
import AdminDashboard from './components/Dashboards/AdminDashboard';
import DoctorDashboard from './components/Dashboards/DoctorDashboard';
import PatientDashboard from './components/Dashboards/PatientDashboard';
import HospitalDashboard from './components/Dashboards/HospitalDashboard';
import VideoCallRoom from './components/VideoCall/VideoCallRoom';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login/hospital" element={<HospitalLogin />} />
          <Route path="/login/:role" element={<Login />} />
          <Route path="/register/:role" element={<Register />} />
          {/* Prevent superadmin registration by redirecting to login */}
          <Route path="/register/superadmin" element={<Login />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard/superadmin" 
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/doctor" 
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/patient" 
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/hospital" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <HospitalDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Video Call Route */}
          <Route 
            path="/video-call/:meetingId" 
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin', 'doctor', 'patient']}>
                <VideoCallRoom />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
