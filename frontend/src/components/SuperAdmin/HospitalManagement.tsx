import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SuperAdmin.css';

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
  establishedDate: string;
  hospitalType: 'government' | 'private' | 'charitable' | 'corporate';
  specialties: string[];
  capacity: {
    totalBeds: number;
    icuBeds: number;
    emergencyBeds: number;
  };
  facilities: string[];
  website?: string;
  emergencyContact: string;
  isActive: boolean;
  adminId?: {
    _id: string;
    name: string;
    email: string;
  };
  subscription: {
    plan: 'basic' | 'premium' | 'enterprise';
    startDate: string;
    endDate: string;
    isActive: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  hospitalId?: string;
}

const HospitalManagement: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [availableAdmins, setAvailableAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  
  const [newHospital, setNewHospital] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    registrationNumber: '',
    licenseNumber: '',
    establishedDate: '',
    hospitalType: 'private' as const,
    specialties: [] as string[],
    capacity: {
      totalBeds: 0,
      icuBeds: 0,
      emergencyBeds: 0
    },
    facilities: [] as string[],
    website: '',
    emergencyContact: '',
    subscription: {
      plan: 'basic' as const,
      endDate: ''
    }
  });

  useEffect(() => {
    fetchHospitals();
    fetchAvailableAdmins();
  }, []);

  const fetchHospitals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/hospitals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHospitals(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch hospitals');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users?role=admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter admins who don't have a hospital assigned
      const unassignedAdmins = response.data.filter((admin: User) => !admin.hospitalId);
      setAvailableAdmins(unassignedAdmins);
    } catch (error) {
      console.error('Failed to fetch available admins:', error);
    }
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const hospitalData = {
        ...newHospital,
        specialties: newHospital.specialties.filter(s => s.trim() !== ''),
        facilities: newHospital.facilities.filter(f => f.trim() !== ''),
        subscription: {
          ...newHospital.subscription,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          isActive: true
        }
      };

      await axios.post('http://localhost:5000/api/hospitals', hospitalData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Hospital created successfully');
      setShowCreateForm(false);
      setNewHospital({
        name: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA'
        },
        registrationNumber: '',
        licenseNumber: '',
        establishedDate: '',
        hospitalType: 'private',
        specialties: [],
        capacity: {
          totalBeds: 0,
          icuBeds: 0,
          emergencyBeds: 0
        },
        facilities: [],
        website: '',
        emergencyContact: '',
        subscription: {
          plan: 'basic',
          endDate: ''
        }
      });
      fetchHospitals();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create hospital');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHospital = async (hospitalId: string) => {
    if (!window.confirm('Are you sure you want to delete this hospital? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/hospitals/${hospitalId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Hospital deleted successfully');
      fetchHospitals();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete hospital');
    }
  };

  const handleAssignAdmin = async (hospitalId: string, adminId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/hospitals/${hospitalId}/assign-admin`, 
        { adminId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Admin assigned successfully');
      fetchHospitals();
      fetchAvailableAdmins();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to assign admin');
    }
  };

  const handleRemoveAdmin = async (hospitalId: string) => {
    if (!window.confirm('Are you sure you want to remove the admin from this hospital?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/hospitals/${hospitalId}/remove-admin`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Admin removed successfully');
      fetchHospitals();
      fetchAvailableAdmins();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to remove admin');
    }
  };

  const handleArrayInput = (value: string, field: 'specialties' | 'facilities') => {
    const items = value.split(',').map(item => item.trim());
    setNewHospital(prev => ({
      ...prev,
      [field]: items
    }));
  };

  if (loading && hospitals.length === 0) {
    return <div className="loading">Loading hospitals...</div>;
  }

  return (
    <div className="hospital-management">
      <div className="section-header">
        <h2>🏥 Hospital Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
          disabled={showCreateForm}
        >
          + Add New Hospital
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Hospital</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateHospital} className="hospital-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Hospital Name *</label>
                  <input
                    type="text"
                    value={newHospital.name}
                    onChange={(e) => setNewHospital(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newHospital.email}
                    onChange={(e) => setNewHospital(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    value={newHospital.phone}
                    onChange={(e) => setNewHospital(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Emergency Contact *</label>
                  <input
                    type="tel"
                    value={newHospital.emergencyContact}
                    onChange={(e) => setNewHospital(prev => ({ ...prev, emergencyContact: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Registration Number *</label>
                  <input
                    type="text"
                    value={newHospital.registrationNumber}
                    onChange={(e) => setNewHospital(prev => ({ ...prev, registrationNumber: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>License Number *</label>
                  <input
                    type="text"
                    value={newHospital.licenseNumber}
                    onChange={(e) => setNewHospital(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Established Date *</label>
                  <input
                    type="date"
                    value={newHospital.establishedDate}
                    onChange={(e) => setNewHospital(prev => ({ ...prev, establishedDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Hospital Type *</label>
                  <select
                    value={newHospital.hospitalType}
                    onChange={(e) => setNewHospital(prev => ({ ...prev, hospitalType: e.target.value as any }))}
                    required
                  >
                    <option value="government">Government</option>
                    <option value="private">Private</option>
                    <option value="charitable">Charitable</option>
                    <option value="corporate">Corporate</option>
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h4>Address</h4>
                <div className="form-group">
                  <label>Street Address *</label>
                  <input
                    type="text"
                    value={newHospital.address.street}
                    onChange={(e) => setNewHospital(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, street: e.target.value }
                    }))}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      value={newHospital.address.city}
                      onChange={(e) => setNewHospital(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>State *</label>
                    <input
                      type="text"
                      value={newHospital.address.state}
                      onChange={(e) => setNewHospital(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, state: e.target.value }
                      }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Zip Code *</label>
                    <input
                      type="text"
                      value={newHospital.address.zipCode}
                      onChange={(e) => setNewHospital(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, zipCode: e.target.value }
                      }))}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Capacity</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Total Beds *</label>
                    <input
                      type="number"
                      value={newHospital.capacity.totalBeds}
                      onChange={(e) => setNewHospital(prev => ({ 
                        ...prev, 
                        capacity: { ...prev.capacity, totalBeds: parseInt(e.target.value) || 0 }
                      }))}
                      required
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>ICU Beds</label>
                    <input
                      type="number"
                      value={newHospital.capacity.icuBeds}
                      onChange={(e) => setNewHospital(prev => ({ 
                        ...prev, 
                        capacity: { ...prev.capacity, icuBeds: parseInt(e.target.value) || 0 }
                      }))}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Emergency Beds</label>
                    <input
                      type="number"
                      value={newHospital.capacity.emergencyBeds}
                      onChange={(e) => setNewHospital(prev => ({ 
                        ...prev, 
                        capacity: { ...prev.capacity, emergencyBeds: parseInt(e.target.value) || 0 }
                      }))}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Specialties (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g., Cardiology, Neurology, Pediatrics"
                    onChange={(e) => handleArrayInput(e.target.value, 'specialties')}
                  />
                </div>
                <div className="form-group">
                  <label>Facilities (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g., Emergency Room, ICU, Surgery, Pharmacy"
                    onChange={(e) => handleArrayInput(e.target.value, 'facilities')}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    value={newHospital.website}
                    onChange={(e) => setNewHospital(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Subscription Plan</label>
                  <select
                    value={newHospital.subscription.plan}
                    onChange={(e) => setNewHospital(prev => ({ 
                      ...prev, 
                      subscription: { ...prev.subscription, plan: e.target.value as any }
                    }))}
                  >
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Hospital'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="hospitals-grid">
        {hospitals.map((hospital) => (
          <div key={hospital._id} className="hospital-card">
            <div className="hospital-header">
              <h3>{hospital.name}</h3>
              <div className="hospital-status">
                <span className={`status-badge ${hospital.isActive ? 'active' : 'inactive'}`}>
                  {hospital.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className={`plan-badge ${hospital.subscription.plan}`}>
                  {hospital.subscription.plan.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="hospital-info">
              <p><strong>Email:</strong> {hospital.email}</p>
              <p><strong>Phone:</strong> {hospital.phone}</p>
              <p><strong>Type:</strong> {hospital.hospitalType}</p>
              <p><strong>Total Beds:</strong> {hospital.capacity.totalBeds}</p>
              <p><strong>Registration:</strong> {hospital.registrationNumber}</p>
            </div>

            <div className="admin-section">
              <h4>Assigned Admin</h4>
              {hospital.adminId ? (
                <div className="admin-info">
                  <p><strong>{hospital.adminId.name}</strong></p>
                  <p>{hospital.adminId.email}</p>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleRemoveAdmin(hospital._id)}
                  >
                    Remove Admin
                  </button>
                </div>
              ) : (
                <div className="admin-assignment">
                  <p>No admin assigned</p>
                  {availableAdmins.length > 0 ? (
                    <select 
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignAdmin(hospital._id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">Select Admin...</option>
                      {availableAdmins.map(admin => (
                        <option key={admin._id} value={admin._id}>
                          {admin.name} ({admin.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="no-admins">No available admins</p>
                  )}
                </div>
              )}
            </div>

            <div className="hospital-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setSelectedHospital(hospital)}
              >
                View Details
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => handleDeleteHospital(hospital._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedHospital && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h3>{selectedHospital.name} - Details</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedHospital(null)}
              >
                ×
              </button>
            </div>
            <div className="hospital-details">
              <div className="details-section">
                <h4>Basic Information</h4>
                <div className="details-grid">
                  <div><strong>Name:</strong> {selectedHospital.name}</div>
                  <div><strong>Email:</strong> {selectedHospital.email}</div>
                  <div><strong>Phone:</strong> {selectedHospital.phone}</div>
                  <div><strong>Emergency Contact:</strong> {selectedHospital.emergencyContact}</div>
                  <div><strong>Registration No:</strong> {selectedHospital.registrationNumber}</div>
                  <div><strong>License No:</strong> {selectedHospital.licenseNumber}</div>
                  <div><strong>Type:</strong> {selectedHospital.hospitalType}</div>
                  <div><strong>Established:</strong> {new Date(selectedHospital.establishedDate).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="details-section">
                <h4>Address</h4>
                <p>
                  {selectedHospital.address.street}<br/>
                  {selectedHospital.address.city}, {selectedHospital.address.state} {selectedHospital.address.zipCode}<br/>
                  {selectedHospital.address.country}
                </p>
              </div>

              <div className="details-section">
                <h4>Capacity</h4>
                <div className="capacity-grid">
                  <div>Total Beds: {selectedHospital.capacity.totalBeds}</div>
                  <div>ICU Beds: {selectedHospital.capacity.icuBeds}</div>
                  <div>Emergency Beds: {selectedHospital.capacity.emergencyBeds}</div>
                </div>
              </div>

              {selectedHospital.specialties.length > 0 && (
                <div className="details-section">
                  <h4>Specialties</h4>
                  <div className="tags">
                    {selectedHospital.specialties.map((specialty, index) => (
                      <span key={index} className="tag">{specialty}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedHospital.facilities.length > 0 && (
                <div className="details-section">
                  <h4>Facilities</h4>
                  <div className="tags">
                    {selectedHospital.facilities.map((facility, index) => (
                      <span key={index} className="tag">{facility}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="details-section">
                <h4>Subscription</h4>
                <div className="subscription-details">
                  <div><strong>Plan:</strong> {selectedHospital.subscription.plan.toUpperCase()}</div>
                  <div><strong>Status:</strong> {selectedHospital.subscription.isActive ? 'Active' : 'Inactive'}</div>
                  <div><strong>Start Date:</strong> {new Date(selectedHospital.subscription.startDate).toLocaleDateString()}</div>
                  <div><strong>End Date:</strong> {new Date(selectedHospital.subscription.endDate).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalManagement;
