import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

interface Hospital {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  registrationNumber: string;
  licenseNumber: string;
  hospitalType: string;
  capacity: {
    totalBeds: number;
    icuBeds: number;
    emergencyBeds: number;
  };
  subscription: {
    plan: string;
    isActive: boolean;
  };
  adminId: {
    _id: string;
    name: string;
    email: string;
  };
}

interface HospitalStats {
  hospital: string;
  users: {
    total: number;
    admins: number;
    doctors: number;
    patients: number;
  };
  capacity: {
    totalBeds: number;
    icuBeds: number;
    emergencyBeds: number;
  };
  isActive: boolean;
  subscription: {
    plan: string;
    isActive: boolean;
  };
}

const HospitalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [stats, setStats] = useState<HospitalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'users'>('overview');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login/hospital');
      return;
    }

    const user = JSON.parse(userData);
    if (!user.hospital || user.loginType !== 'hospital') {
      navigate('/login/hospital');
      return;
    }

    fetchHospitalData(user.hospital._id);
  }, [navigate]);

  const fetchHospitalData = async (hospitalId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [hospitalResponse, statsResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/hospitals/${hospitalId}`, { headers }),
        axios.get(`http://localhost:5000/api/hospitals/${hospitalId}/stats`, { headers })
      ]);

      setHospital(hospitalResponse.data);
      setStats(statsResponse.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load hospital data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-spinner">Loading hospital dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>🏥 {hospital?.name}</h1>
          <p>Hospital Management Dashboard</p>
        </div>
        <div className="header-right">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <p className="stat-number">{stats?.users.total || 0}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👨‍⚕️</div>
                <div className="stat-info">
                  <h3>Doctors</h3>
                  <p className="stat-number">{stats?.users.doctors || 0}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏃‍♂️</div>
                <div className="stat-info">
                  <h3>Patients</h3>
                  <p className="stat-number">{stats?.users.patients || 0}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏥</div>
                <div className="stat-info">
                  <h3>Total Beds</h3>
                  <p className="stat-number">{stats?.capacity.totalBeds || 0}</p>
                </div>
              </div>
            </div>

            <div className="hospital-info-grid">
              <div className="info-card">
                <h3>Hospital Information</h3>
                <div className="info-item">
                  <strong>Registration No:</strong> {hospital?.registrationNumber}
                </div>
                <div className="info-item">
                  <strong>License No:</strong> {hospital?.licenseNumber}
                </div>
                <div className="info-item">
                  <strong>Type:</strong> {hospital?.hospitalType}
                </div>
                <div className="info-item">
                  <strong>Email:</strong> {hospital?.email}
                </div>
                <div className="info-item">
                  <strong>Phone:</strong> {hospital?.phone}
                </div>
              </div>

              <div className="info-card">
                <h3>Address</h3>
                <div className="address">
                  <p>{hospital?.address.street}</p>
                  <p>{hospital?.address.city}, {hospital?.address.state}</p>
                  <p>{hospital?.address.zipCode}, {hospital?.address.country}</p>
                </div>
              </div>

              <div className="info-card">
                <h3>Capacity</h3>
                <div className="capacity-info">
                  <div className="capacity-item">
                    <span>Total Beds:</span>
                    <span>{hospital?.capacity.totalBeds}</span>
                  </div>
                  <div className="capacity-item">
                    <span>ICU Beds:</span>
                    <span>{hospital?.capacity.icuBeds}</span>
                  </div>
                  <div className="capacity-item">
                    <span>Emergency Beds:</span>
                    <span>{hospital?.capacity.emergencyBeds}</span>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <h3>Subscription</h3>
                <div className="subscription-info">
                  <div className="subscription-item">
                    <span>Plan:</span>
                    <span className={`plan-badge ${hospital?.subscription.plan}`}>
                      {hospital?.subscription.plan?.toUpperCase()}
                    </span>
                  </div>
                  <div className="subscription-item">
                    <span>Status:</span>
                    <span className={`status-badge ${hospital?.subscription.isActive ? 'active' : 'inactive'}`}>
                      {hospital?.subscription.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <h3>User Management</h3>
            <div className="user-stats">
              <div className="user-stat-item">
                <h4>Admins</h4>
                <p>{stats?.users.admins || 0}</p>
              </div>
              <div className="user-stat-item">
                <h4>Doctors</h4>
                <p>{stats?.users.doctors || 0}</p>
              </div>
              <div className="user-stat-item">
                <h4>Patients</h4>
                <p>{stats?.users.patients || 0}</p>
              </div>
            </div>
            <p className="note">User management features will be implemented based on your hospital's needs.</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-section">
            <h3>Hospital Settings</h3>
            <div className="settings-grid">
              <div className="setting-group">
                <h4>Contact Administrator</h4>
                <p><strong>Name:</strong> {hospital?.adminId?.name}</p>
                <p><strong>Email:</strong> {hospital?.adminId?.email}</p>
              </div>
              <div className="setting-group">
                <h4>System Status</h4>
                <p><strong>Hospital Status:</strong> 
                  <span className={`status-badge ${stats?.isActive ? 'active' : 'inactive'}`}>
                    {stats?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>
            <p className="note">Advanced settings and configuration options will be available through your administrator.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalDashboard;
