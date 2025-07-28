import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SuperAdmin.css';

interface Doctor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: number;
  qualification: string;
  department: {
    _id: string;
    name: string;
  };
  isActive: boolean;
  createdAt: string;
}

interface Department {
  _id: string;
  name: string;
}

interface NewDoctor {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  specialization: string;
  experience: number;
  qualification: string;
  department: string;
}

const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newDoctor, setNewDoctor] = useState<NewDoctor>({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    specialization: '',
    experience: 0,
    qualification: '',
    department: ''
  });

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, []);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users?role=doctor', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/auth/register', 
        { ...newDoctor, role: 'doctor' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowAddForm(false);
      setNewDoctor({
        name: '', email: '', password: '', phone: '', address: '',
        specialization: '', experience: 0, qualification: '', department: ''
      });
      fetchDoctors();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error adding doctor');
    }
  };

  const handleToggleActive = async (doctorId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/users/${doctorId}`,
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDoctors();
    } catch (error) {
      console.error('Error updating doctor status:', error);
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/users/${doctorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchDoctors();
      } catch (error) {
        console.error('Error deleting doctor:', error);
      }
    }
  };

  if (loading) return <div className="loading">Loading doctors...</div>;

  return (
    <div className="doctor-management">
      <div className="management-header">
        <h2>👨‍⚕️ Doctor Management</h2>
        <button 
          className="add-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add New Doctor
        </button>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h3>Add New Doctor</h3>
            <form onSubmit={handleAddDoctor}>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newDoctor.name}
                  onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newDoctor.email}
                  onChange={(e) => setNewDoctor({...newDoctor, email: e.target.value})}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newDoctor.password}
                  onChange={(e) => setNewDoctor({...newDoctor, password: e.target.value})}
                  required
                  minLength={6}
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={newDoctor.phone}
                  onChange={(e) => setNewDoctor({...newDoctor, phone: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Specialization"
                  value={newDoctor.specialization}
                  onChange={(e) => setNewDoctor({...newDoctor, specialization: e.target.value})}
                  required
                />
                <input
                  type="number"
                  placeholder="Experience (years)"
                  value={newDoctor.experience}
                  onChange={(e) => setNewDoctor({...newDoctor, experience: parseInt(e.target.value) || 0})}
                  required
                  min="0"
                />
                <input
                  type="text"
                  placeholder="Qualification"
                  value={newDoctor.qualification}
                  onChange={(e) => setNewDoctor({...newDoctor, qualification: e.target.value})}
                  required
                />
                <select
                  value={newDoctor.department}
                  onChange={(e) => setNewDoctor({...newDoctor, department: e.target.value})}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <textarea
                placeholder="Address"
                value={newDoctor.address}
                onChange={(e) => setNewDoctor({...newDoctor, address: e.target.value})}
                required
              />
              <div className="modal-actions">
                <button type="submit" className="save-btn">Save Doctor</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="management-stats">
        <div className="stat-item">
          <span className="stat-number">{doctors.length}</span>
          <span className="stat-label">Total Doctors</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{doctors.filter(doc => doc.isActive).length}</span>
          <span className="stat-label">Active Doctors</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{departments.length}</span>
          <span className="stat-label">Departments</span>
        </div>
      </div>

      <div className="doctors-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Specialization</th>
              <th>Department</th>
              <th>Experience</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doctor) => (
              <tr key={doctor._id}>
                <td>
                  <div className="doctor-info">
                    <strong>{doctor.name}</strong>
                    <small>{doctor.qualification}</small>
                  </div>
                </td>
                <td>{doctor.email}</td>
                <td>{doctor.specialization}</td>
                <td>{doctor.department?.name}</td>
                <td>{doctor.experience} years</td>
                <td>
                  <span className={`status-badge ${doctor.isActive ? 'active' : 'inactive'}`}>
                    {doctor.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className={`toggle-btn ${doctor.isActive ? 'deactivate' : 'activate'}`}
                      onClick={() => handleToggleActive(doctor._id, doctor.isActive)}
                    >
                      {doctor.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteDoctor(doctor._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorManagement;
