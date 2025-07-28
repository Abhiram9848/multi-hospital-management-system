import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

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
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
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
      alert('Doctor added successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error adding doctor');
    }
  };

  const handleEditDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/users/${editingDoctor._id}`,
        {
          name: editingDoctor.name,
          email: editingDoctor.email,
          phone: editingDoctor.phone,
          specialization: editingDoctor.specialization,
          experience: editingDoctor.experience,
          qualification: editingDoctor.qualification,
          department: editingDoctor.department._id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowEditForm(false);
      setEditingDoctor(null);
      fetchDoctors();
      alert('Doctor updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating doctor');
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
    if (window.confirm('Are you sure you want to delete this doctor? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/users/${doctorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchDoctors();
        alert('Doctor deleted successfully!');
      } catch (error) {
        console.error('Error deleting doctor:', error);
      }
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === '' || doctor.department._id === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  if (loading) return <div className="loading">Loading doctors...</div>;

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>👨‍⚕️ Doctor Management</h2>
        <button 
          className="add-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add New Doctor
        </button>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search doctors by name, email, or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Doctor Modal */}
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

      {/* Edit Doctor Modal */}
      {showEditForm && editingDoctor && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h3>Edit Doctor</h3>
            <form onSubmit={handleEditDoctor}>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={editingDoctor.name}
                  onChange={(e) => setEditingDoctor({...editingDoctor, name: e.target.value})}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={editingDoctor.email}
                  onChange={(e) => setEditingDoctor({...editingDoctor, email: e.target.value})}
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={editingDoctor.phone}
                  onChange={(e) => setEditingDoctor({...editingDoctor, phone: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Specialization"
                  value={editingDoctor.specialization}
                  onChange={(e) => setEditingDoctor({...editingDoctor, specialization: e.target.value})}
                  required
                />
                <input
                  type="number"
                  placeholder="Experience (years)"
                  value={editingDoctor.experience}
                  onChange={(e) => setEditingDoctor({...editingDoctor, experience: parseInt(e.target.value) || 0})}
                  required
                  min="0"
                />
                <input
                  type="text"
                  placeholder="Qualification"
                  value={editingDoctor.qualification}
                  onChange={(e) => setEditingDoctor({...editingDoctor, qualification: e.target.value})}
                  required
                />
                <select
                  value={editingDoctor.department._id}
                  onChange={(e) => {
                    const selectedDept = departments.find(d => d._id === e.target.value);
                    if (selectedDept) {
                      setEditingDoctor({...editingDoctor, department: selectedDept});
                    }
                  }}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-btn">Update Doctor</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowEditForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statistics */}
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
          <span className="stat-number">{filteredDoctors.length}</span>
          <span className="stat-label">Filtered Results</span>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="doctors-table">
        <table>
          <thead>
            <tr>
              <th>Doctor Info</th>
              <th>Contact</th>
              <th>Specialization</th>
              <th>Department</th>
              <th>Experience</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDoctors.map((doctor) => (
              <tr key={doctor._id}>
                <td>
                  <div className="doctor-info">
                    <strong>{doctor.name}</strong>
                    <small>{doctor.qualification}</small>
                  </div>
                </td>
                <td>
                  <div className="contact-info">
                    <div>{doctor.email}</div>
                    <small>{doctor.phone}</small>
                  </div>
                </td>
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
                      className="edit-btn"
                      onClick={() => {
                        setEditingDoctor(doctor);
                        setShowEditForm(true);
                      }}
                    >
                      Edit
                    </button>
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
        
        {filteredDoctors.length === 0 && (
          <div className="no-results">
            <p>No doctors found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorManagement;
