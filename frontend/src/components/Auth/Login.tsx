import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

interface LoginData {
  email: string;
  password: string;
  role: string;
}

const Login: React.FC = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
    role: role || 'patient'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roleConfig = {
    superadmin: { title: 'Super Admin', icon: '🏥', color: '#dc3545' },
    admin: { title: 'Admin', icon: '👨‍💼', color: '#fd7e14' },
    doctor: { title: 'Doctor', icon: '👨‍⚕️', color: '#198754' },
    patient: { title: 'Patient', icon: '🏃‍♂️', color: '#0d6efd' }
  };

  const currentRole = roleConfig[role as keyof typeof roleConfig];

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
      console.log('Login attempt with data:', formData);
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      console.log('Login response:', response.data);
      
      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      
      // Navigate to dashboard based on role
      navigate(`/dashboard/${role}`);
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (!currentRole) {
    return <div>Invalid role</div>;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="role-icon" style={{ color: currentRole.color }}>
            {currentRole.icon}
          </div>
          <h2 style={{ color: currentRole.color }}>
            {currentRole.title} Login
          </h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button 
            type="submit" 
            className="auth-btn"
            style={{ backgroundColor: currentRole.color }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-links">
          {role !== 'superadmin' && (
            <p>
              Don't have an account? 
              <Link to={`/register/${role}`} style={{ color: currentRole.color }}>
                Register here
              </Link>
            </p>
          )}
          <Link to="/" className="back-link">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
