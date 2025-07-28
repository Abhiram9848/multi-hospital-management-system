import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DoctorManagement from '../Admin/DoctorManagement';
import PatientManagement from '../Admin/PatientManagement';
import DepartmentManagement from '../Admin/DepartmentManagement';
import Reports from '../Admin/Reports';
import AppointmentManagement from '../Admin/AppointmentManagement';
import './Dashboard.css';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Stats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
}

const AdminDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch users by role
      const [doctorsRes, patientsRes, appointmentsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/users?role=doctor', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/users?role=patient', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats({
        totalDoctors: doctorsRes.data.length,
        totalPatients: patientsRes.data.length,
        totalUsers: doctorsRes.data.length + patientsRes.data.length,
        totalAppointments: appointmentsRes.data.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'doctors':
        return <DoctorManagement />;
      case 'patients':
        return <PatientManagement />;
      case 'departments':
        return <DepartmentManagement />;
      case 'reports':
        return <Reports />;
      case 'appointments':
        return <AppointmentManagement />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <>
      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{stats.totalUsers}</h3>
              <p>Total Users</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👨‍⚕️</div>
            <div className="stat-info">
              <h3>{stats.totalDoctors}</h3>
              <p>Doctors</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏃‍♂️</div>
            <div className="stat-info">
              <h3>{stats.totalPatients}</h3>
              <p>Patients</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <h3>{stats.totalAppointments}</h3>
              <p>Appointments</p>
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <div className="action-card">
              <div className="action-icon">👨‍⚕️</div>
              <h3>Manage Doctors</h3>
              <p>Add, edit, or remove doctor accounts</p>
              <button className="action-btn" onClick={() => setActiveSection('doctors')}>Manage Doctors</button>
            </div>
            <div className="action-card">
              <div className="action-icon">🏃‍♂️</div>
              <h3>Manage Patients</h3>
              <p>View and manage patient records</p>
              <button className="action-btn" onClick={() => setActiveSection('patients')}>Manage Patients</button>
            </div>
            <div className="action-card">
              <div className="action-icon">🏥</div>
              <h3>Departments</h3>
              <p>Manage hospital departments</p>
              <button className="action-btn" onClick={() => setActiveSection('departments')}>Manage Departments</button>
            </div>
            <div className="action-card">
              <div className="action-icon">📊</div>
              <h3>Reports</h3>
              <p>View system reports and analytics</p>
              <button className="action-btn" onClick={() => setActiveSection('reports')}>View Reports</button>
            </div>
            <div className="action-card">
              <div className="action-icon">📅</div>
              <h3>Appointments</h3>
              <p>Manage all hospital appointments</p>
              <button className="action-btn" onClick={() => setActiveSection('appointments')}>Manage Appointments</button>
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">✅</div>
              <div className="activity-info">
                <p><strong>New patient registered</strong></p>
                <p className="activity-time">2 hours ago</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📅</div>
              <div className="activity-info">
                <p><strong>New appointment scheduled</strong></p>
                <p className="activity-time">4 hours ago</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">👨‍⚕️</div>
              <div className="activity-info">
                <p><strong>Doctor profile updated</strong></p>
                <p className="activity-time">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>👨‍💼 Admin Dashboard</h1>
          <p>Welcome back, {user?.name}!</p>
        </div>
        <div className="dashboard-nav">
          <button 
            className={activeSection === 'dashboard' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveSection('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={activeSection === 'doctors' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveSection('doctors')}
          >
            👨‍⚕️ Doctors
          </button>
          <button 
            className={activeSection === 'patients' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveSection('patients')}
          >
            🏃‍♂️ Patients
          </button>
          <button 
            className={activeSection === 'departments' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveSection('departments')}
          >
            🏥 Departments
          </button>
          <button 
            className={activeSection === 'appointments' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveSection('appointments')}
          >
            📅 Appointments
          </button>
          <button 
            className={activeSection === 'reports' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveSection('reports')}
          >
            📊 Reports
          </button>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      {renderContent()}
    </div>
  );
};

export default AdminDashboard;
