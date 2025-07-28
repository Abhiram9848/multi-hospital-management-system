import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

interface HospitalLoginData {
  email: string;
  password: string;
  adminEmail: string;
}

const HospitalLogin: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<HospitalLoginData>({
    email: '',
    password: '',
    adminEmail: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Hospital login attempt with data:', formData);
      
      // First, authenticate the hospital admin
      const adminResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: formData.adminEmail,
        password: formData.password,
        role: 'admin'
      });

      console.log('Admin login response:', adminResponse.data);

      // Check if admin has a hospital association
      if (!adminResponse.data.hospitalId) {
        throw new Error('Admin user is not assigned to any hospital. Please contact the super admin.');
      }

      // Then, verify hospital association
      const hospitalResponse = await axios.get(
        `http://localhost:5000/api/hospitals/${adminResponse.data.hospitalId}`,
        {
          headers: { Authorization: `Bearer ${adminResponse.data.token}` }
        }
      );

      console.log('Hospital verification response:', hospitalResponse.data);

      // Verify hospital email matches
      if (hospitalResponse.data.email !== formData.email) {
        throw new Error('Hospital email does not match admin association');
      }

      // Store token and user data with hospital context
      localStorage.setItem('token', adminResponse.data.token);
      localStorage.setItem('user', JSON.stringify({
        ...adminResponse.data,
        hospital: hospitalResponse.data,
        loginType: 'hospital'
      }));
      
      // Navigate to hospital dashboard
      navigate('/dashboard/hospital');
    } catch (err: any) {
      console.error('Hospital login error:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMessage = 'Hospital login failed';
      
      if (err.message && err.message.includes('Admin user is not assigned')) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message && err.message.includes('Hospital email does not match')) {
        errorMessage = 'The hospital email does not match the admin\'s assigned hospital';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="role-icon" style={{ color: '#6f42c1' }}>
            🏥
          </div>
          <h2 style={{ color: '#6f42c1' }}>
            Hospital Login
          </h2>
          <p className="auth-subtitle">
            Access your hospital management system
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Hospital Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter hospital email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="adminEmail">Admin Email</label>
            <input
              type="email"
              id="adminEmail"
              name="adminEmail"
              value={formData.adminEmail}
              onChange={handleChange}
              required
              placeholder="Enter admin email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Admin Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter admin password"
            />
          </div>

          <button 
            type="submit" 
            className="auth-btn"
            style={{ backgroundColor: '#6f42c1' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login to Hospital'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/" className="back-link">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HospitalLogin;
