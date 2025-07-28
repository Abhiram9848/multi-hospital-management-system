import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

interface Patient {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  isActive: boolean;
  createdAt: string;
}

interface PatientStats {
  totalAppointments: number;
  completedAppointments: number;
  upcomingAppointments: number;
}

const PatientManagement: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [patientStats, setPatientStats] = useState<PatientStats | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users?role=patient', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientStats = async (patientId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const patientAppointments = response.data.filter((apt: any) => 
        apt.patient._id === patientId || apt.patient === patientId
      );
      
      setPatientStats({
        totalAppointments: patientAppointments.length,
        completedAppointments: patientAppointments.filter((apt: any) => apt.status === 'completed').length,
        upcomingAppointments: patientAppointments.filter((apt: any) => apt.status === 'scheduled').length
      });
    } catch (error) {
      console.error('Error fetching patient stats:', error);
    }
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientDetails(true);
    fetchPatientStats(patient._id);
  };

  const handleToggleActive = async (patientId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/users/${patientId}`,
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPatients();
    } catch (error) {
      console.error('Error updating patient status:', error);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (window.confirm('Are you sure you want to delete this patient? This will also delete all their appointments and medical records.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/users/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchPatients();
        alert('Patient deleted successfully!');
      } catch (error) {
        console.error('Error deleting patient:', error);
      }
    }
  };

  const exportPatientData = () => {
    const csvContent = [
      'Name,Email,Phone,Date of Birth,Gender,Blood Group,Emergency Contact',
      ...filteredPatients.map(patient => 
        `${patient.name},${patient.email},${patient.phone},${new Date(patient.dateOfBirth).toLocaleDateString()},${patient.gender},${patient.bloodGroup},"${patient.emergencyContact.name} (${patient.emergencyContact.relation}) - ${patient.emergencyContact.phone}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patients-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.phone.includes(searchTerm);
    const matchesGender = filterGender === '' || patient.gender === filterGender;
    const matchesBloodGroup = filterBloodGroup === '' || patient.bloodGroup === filterBloodGroup;
    return matchesSearch && matchesGender && matchesBloodGroup;
  });

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) return <div className="loading">Loading patients...</div>;

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>🏃‍♂️ Patient Management</h2>
        <button 
          className="export-btn"
          onClick={exportPatientData}
        >
          📥 Export Patient Data
        </button>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search patients by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <select
            value={filterBloodGroup}
            onChange={(e) => setFilterBloodGroup(e.target.value)}
          >
            <option value="">All Blood Groups</option>
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
      </div>

      {/* Patient Details Modal */}
      {showPatientDetails && selectedPatient && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="patient-details-header">
              <h3>Patient Details</h3>
              <button 
                className="close-btn"
                onClick={() => setShowPatientDetails(false)}
              >
                ×
              </button>
            </div>
            
            <div className="patient-details-content">
              <div className="patient-info-grid">
                <div className="info-section">
                  <h4>Personal Information</h4>
                  <div className="info-item">
                    <label>Full Name:</label>
                    <span>{selectedPatient.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{selectedPatient.email}</span>
                  </div>
                  <div className="info-item">
                    <label>Phone:</label>
                    <span>{selectedPatient.phone}</span>
                  </div>
                  <div className="info-item">
                    <label>Address:</label>
                    <span>{selectedPatient.address}</span>
                  </div>
                </div>

                <div className="info-section">
                  <h4>Medical Information</h4>
                  <div className="info-item">
                    <label>Date of Birth:</label>
                    <span>{new Date(selectedPatient.dateOfBirth).toLocaleDateString()} ({calculateAge(selectedPatient.dateOfBirth)} years old)</span>
                  </div>
                  <div className="info-item">
                    <label>Gender:</label>
                    <span className="capitalize">{selectedPatient.gender}</span>
                  </div>
                  <div className="info-item">
                    <label>Blood Group:</label>
                    <span className="blood-group">{selectedPatient.bloodGroup}</span>
                  </div>
                  <div className="info-item">
                    <label>Registration Date:</label>
                    <span>{new Date(selectedPatient.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="info-section">
                  <h4>Emergency Contact</h4>
                  <div className="info-item">
                    <label>Name:</label>
                    <span>{selectedPatient.emergencyContact.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Phone:</label>
                    <span>{selectedPatient.emergencyContact.phone}</span>
                  </div>
                  <div className="info-item">
                    <label>Relation:</label>
                    <span className="capitalize">{selectedPatient.emergencyContact.relation}</span>
                  </div>
                </div>

                {patientStats && (
                  <div className="info-section">
                    <h4>Appointment Statistics</h4>
                    <div className="stats-grid">
                      <div className="stat-card small">
                        <span className="stat-number">{patientStats.totalAppointments}</span>
                        <span className="stat-label">Total</span>
                      </div>
                      <div className="stat-card small">
                        <span className="stat-number">{patientStats.completedAppointments}</span>
                        <span className="stat-label">Completed</span>
                      </div>
                      <div className="stat-card small">
                        <span className="stat-number">{patientStats.upcomingAppointments}</span>
                        <span className="stat-label">Upcoming</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="management-stats">
        <div className="stat-item">
          <span className="stat-number">{patients.length}</span>
          <span className="stat-label">Total Patients</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{patients.filter(p => p.isActive).length}</span>
          <span className="stat-label">Active Patients</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{filteredPatients.length}</span>
          <span className="stat-label">Filtered Results</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{patients.filter(p => p.gender === 'male').length}</span>
          <span className="stat-label">Male Patients</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{patients.filter(p => p.gender === 'female').length}</span>
          <span className="stat-label">Female Patients</span>
        </div>
      </div>

      {/* Patients Table */}
      <div className="patients-table">
        <table>
          <thead>
            <tr>
              <th>Patient Info</th>
              <th>Contact</th>
              <th>Age/Gender</th>
              <th>Blood Group</th>
              <th>Emergency Contact</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((patient) => (
              <tr key={patient._id}>
                <td>
                  <div className="patient-info">
                    <strong>{patient.name}</strong>
                    <small>Reg: {new Date(patient.createdAt).toLocaleDateString()}</small>
                  </div>
                </td>
                <td>
                  <div className="contact-info">
                    <div>{patient.email}</div>
                    <small>{patient.phone}</small>
                  </div>
                </td>
                <td>
                  <div className="age-gender">
                    <span>{calculateAge(patient.dateOfBirth)} years</span>
                    <small className="capitalize">{patient.gender}</small>
                  </div>
                </td>
                <td>
                  <span className="blood-group">{patient.bloodGroup}</span>
                </td>
                <td>
                  <div className="emergency-contact">
                    <span>{patient.emergencyContact.name}</span>
                    <small>{patient.emergencyContact.phone}</small>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${patient.isActive ? 'active' : 'inactive'}`}>
                    {patient.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="view-btn"
                      onClick={() => handleViewPatient(patient)}
                    >
                      View
                    </button>
                    <button
                      className={`toggle-btn ${patient.isActive ? 'deactivate' : 'activate'}`}
                      onClick={() => handleToggleActive(patient._id, patient.isActive)}
                    >
                      {patient.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeletePatient(patient._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredPatients.length === 0 && (
          <div className="no-results">
            <p>No patients found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientManagement;
