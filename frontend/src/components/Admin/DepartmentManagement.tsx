import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

interface Department {
  _id: string;
  name: string;
  description: string;
  headOfDepartment?: {
    _id: string;
    name: string;
    email: string;
  };
  isActive: boolean;
  createdAt: string;
}

interface Doctor {
  _id: string;
  name: string;
  email: string;
  specialization: string;
}

interface DepartmentStats {
  doctorCount: number;
  appointmentCount: number;
}

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [departmentStats, setDepartmentStats] = useState<{[key: string]: DepartmentStats}>({});
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    headOfDepartment: ''
  });

  useEffect(() => {
    fetchDepartments();
    fetchDoctors();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data);
      await fetchDepartmentStats(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users?role=doctor', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchDepartmentStats = async (depts: Department[]) => {
    try {
      const token = localStorage.getItem('token');
      const [doctorsRes, appointmentsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/users?role=doctor', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const stats: {[key: string]: DepartmentStats} = {};
      
      depts.forEach(dept => {
        const deptDoctors = doctorsRes.data.filter((doc: any) => doc.department?._id === dept._id);
        const deptAppointments = appointmentsRes.data.filter((apt: any) => 
          deptDoctors.some((doc: any) => doc._id === apt.doctor || apt.doctor._id === doc._id)
        );
        
        stats[dept._id] = {
          doctorCount: deptDoctors.length,
          appointmentCount: deptAppointments.length
        };
      });

      setDepartmentStats(stats);
    } catch (error) {
      console.error('Error fetching department stats:', error);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/departments', 
        newDepartment,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowAddForm(false);
      setNewDepartment({ name: '', description: '', headOfDepartment: '' });
      fetchDepartments();
      alert('Department added successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error adding department');
    }
  };

  const handleEditDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartment) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/departments/${editingDepartment._id}`,
        {
          name: editingDepartment.name,
          description: editingDepartment.description,
          headOfDepartment: editingDepartment.headOfDepartment?._id || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowEditForm(false);
      setEditingDepartment(null);
      fetchDepartments();
      alert('Department updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating department');
    }
  };

  const handleToggleActive = async (deptId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/departments/${deptId}`,
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDepartments();
    } catch (error) {
      console.error('Error updating department status:', error);
    }
  };

  const handleDeleteDepartment = async (deptId: string) => {
    const department = departments.find(d => d._id === deptId);
    const stats = departmentStats[deptId];
    
    if (stats && stats.doctorCount > 0) {
      alert('Cannot delete department with assigned doctors. Please reassign doctors first.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${department?.name}" department? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/departments/${deptId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchDepartments();
        alert('Department deleted successfully!');
      } catch (error) {
        console.error('Error deleting department:', error);
      }
    }
  };

  const assignHeadOfDepartment = async (deptId: string, doctorId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/departments/${deptId}`,
        { headOfDepartment: doctorId || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDepartments();
      alert('Head of Department assigned successfully!');
    } catch (error) {
      console.error('Error assigning head of department:', error);
    }
  };

  if (loading) return <div className="loading">Loading departments...</div>;

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>🏥 Department Management</h2>
        <button 
          className="add-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add New Department
        </button>
      </div>

      {/* Add Department Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Department</h3>
            <form onSubmit={handleAddDepartment}>
              <input
                type="text"
                placeholder="Department Name"
                value={newDepartment.name}
                onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                required
              />
              <textarea
                placeholder="Department Description"
                value={newDepartment.description}
                onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                required
                rows={4}
              />
              <select
                value={newDepartment.headOfDepartment}
                onChange={(e) => setNewDepartment({...newDepartment, headOfDepartment: e.target.value})}
              >
                <option value="">Select Head of Department (Optional)</option>
                {doctors.map(doctor => (
                  <option key={doctor._id} value={doctor._id}>
                    Dr. {doctor.name} - {doctor.specialization}
                  </option>
                ))}
              </select>
              <div className="modal-actions">
                <button type="submit" className="save-btn">Save Department</button>
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

      {/* Edit Department Modal */}
      {showEditForm && editingDepartment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Department</h3>
            <form onSubmit={handleEditDepartment}>
              <input
                type="text"
                placeholder="Department Name"
                value={editingDepartment.name}
                onChange={(e) => setEditingDepartment({...editingDepartment, name: e.target.value})}
                required
              />
              <textarea
                placeholder="Department Description"
                value={editingDepartment.description}
                onChange={(e) => setEditingDepartment({...editingDepartment, description: e.target.value})}
                required
                rows={4}
              />
              <select
                value={editingDepartment.headOfDepartment?._id || ''}
                onChange={(e) => {
                  const selectedDoctor = doctors.find(d => d._id === e.target.value);
                  setEditingDepartment({
                    ...editingDepartment, 
                    headOfDepartment: selectedDoctor ? {
                      _id: selectedDoctor._id,
                      name: selectedDoctor.name,
                      email: selectedDoctor.email
                    } : undefined
                  });
                }}
              >
                <option value="">Select Head of Department (Optional)</option>
                {doctors.map(doctor => (
                  <option key={doctor._id} value={doctor._id}>
                    Dr. {doctor.name} - {doctor.specialization}
                  </option>
                ))}
              </select>
              <div className="modal-actions">
                <button type="submit" className="save-btn">Update Department</button>
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
          <span className="stat-number">{departments.length}</span>
          <span className="stat-label">Total Departments</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{departments.filter(d => d.isActive).length}</span>
          <span className="stat-label">Active Departments</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{departments.filter(d => d.headOfDepartment).length}</span>
          <span className="stat-label">With Department Head</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {Object.values(departmentStats).reduce((sum, stats) => sum + stats.doctorCount, 0)}
          </span>
          <span className="stat-label">Total Doctors</span>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="departments-grid">
        {departments.map((department) => (
          <div key={department._id} className="department-card">
            <div className="dept-header">
              <h3>{department.name}</h3>
              <div className="dept-actions">
                <span className={`status-badge ${department.isActive ? 'active' : 'inactive'}`}>
                  {department.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <p className="dept-description">{department.description}</p>
            
            <div className="dept-stats">
              <div className="stat-row">
                <span className="stat-label">Doctors:</span>
                <span className="stat-value">{departmentStats[department._id]?.doctorCount || 0}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Appointments:</span>
                <span className="stat-value">{departmentStats[department._id]?.appointmentCount || 0}</span>
              </div>
            </div>

            <div className="dept-head-section">
              <h4>Head of Department</h4>
              {department.headOfDepartment ? (
                <div className="head-info">
                  <strong>Dr. {department.headOfDepartment.name}</strong>
                  <small>{department.headOfDepartment.email}</small>
                </div>
              ) : (
                <p className="no-head">No head assigned</p>
              )}
              
              <select
                className="head-select"
                value={department.headOfDepartment?._id || ''}
                onChange={(e) => assignHeadOfDepartment(department._id, e.target.value)}
              >
                <option value="">Select Head of Department</option>
                {doctors
                  .filter(doctor => 
                    // Show doctors from this department or doctors without department head role
                    doctors.find(d => d._id === doctor._id) &&
                    !departments.some(d => d.headOfDepartment?._id === doctor._id && d._id !== department._id)
                  )
                  .map(doctor => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.name} - {doctor.specialization}
                    </option>
                  ))}
              </select>
            </div>
            
            <div className="dept-card-actions">
              <button
                className="edit-btn"
                onClick={() => {
                  setEditingDepartment(department);
                  setShowEditForm(true);
                }}
              >
                Edit
              </button>
              <button
                className={`toggle-btn ${department.isActive ? 'deactivate' : 'activate'}`}
                onClick={() => handleToggleActive(department._id, department.isActive)}
              >
                {department.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDeleteDepartment(department._id)}
                disabled={departmentStats[department._id]?.doctorCount > 0}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {departments.length === 0 && (
        <div className="no-results">
          <p>No departments found. Create your first department to get started.</p>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;
