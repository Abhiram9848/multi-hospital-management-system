import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  role: string;
  // Doctor specific fields
  specialization?: string;
  experience?: number;
  qualification?: string;
  department?: string;
  // Patient specific fields
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
}

const Register: React.FC = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: role || 'patient',
    emergencyContact: { name: '', phone: '', relation: '' }
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        emergencyContact: {
          ...formData.emergencyContact!,
          [field]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', formData);
      
      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      
      // Navigate to dashboard based on role
      navigate(`/dashboard/${role}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (!currentRole) {
    return <div>Invalid role</div>;
  }

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <div className="auth-header">
          <div className="role-icon" style={{ color: currentRole.color }}>
            {currentRole.icon}
          </div>
          <h2 style={{ color: currentRole.color }}>
            {currentRole.title} Registration
          </h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Common fields */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>
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
          </div>

          <div className="form-row">
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
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="Enter your address"
            />
          </div>

          {/* Doctor specific fields */}
          {role === 'doctor' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="specialization">Specialization</label>
                  <input
                    type="text"
                    id="specialization"
                    name="specialization"
                    value={formData.specialization || ''}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Cardiology"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="experience">Experience (years)</label>
                  <input
                    type="number"
                    id="experience"
                    name="experience"
                    value={formData.experience || ''}
                    onChange={handleChange}
                    required
                    placeholder="Years of experience"
                    min="0"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="qualification">Qualification</label>
                <input
                  type="text"
                  id="qualification"
                  name="qualification"
                  value={formData.qualification || ''}
                  onChange={handleChange}
                  required
                  placeholder="e.g., MBBS, MD"
                />
              </div>
            </>
          )}

          {/* Patient specific fields */}
          {role === 'patient' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender || ''}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="bloodGroup">Blood Group</label>
                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  value={formData.bloodGroup || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              
              <h4>Emergency Contact</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="emergencyContact.name">Contact Name</label>
                  <input
                    type="text"
                    id="emergencyContact.name"
                    name="emergencyContact.name"
                    value={formData.emergencyContact?.name || ''}
                    onChange={handleChange}
                    placeholder="Emergency contact name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="emergencyContact.phone">Contact Phone</label>
                  <input
                    type="tel"
                    id="emergencyContact.phone"
                    name="emergencyContact.phone"
                    value={formData.emergencyContact?.phone || ''}
                    onChange={handleChange}
                    placeholder="Emergency contact phone"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="emergencyContact.relation">Relation</label>
                <input
                  type="text"
                  id="emergencyContact.relation"
                  name="emergencyContact.relation"
                  value={formData.emergencyContact?.relation || ''}
                  onChange={handleChange}
                  placeholder="e.g., Father, Mother, Spouse"
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="auth-btn"
            style={{ backgroundColor: currentRole.color }}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Already have an account? 
            <Link to={`/login/${role}`} style={{ color: currentRole.color }}>
              Login here
            </Link>
          </p>
          <Link to="/" className="back-link">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
