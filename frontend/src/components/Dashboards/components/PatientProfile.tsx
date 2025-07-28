import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface PatientProfileProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
}

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
}

interface MedicalHistory {
  _id: string;
  appointmentDate: string;
  doctor: { name: string; specialization: string };
  department: { name: string };
  status: string;
  reason: string;
  notes?: string;
  prescription?: {
    medicines: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    instructions: string;
  };
}

const PatientProfile: React.FC<PatientProfileProps> = ({ patientId, isOpen, onClose }) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');

  useEffect(() => {
    if (isOpen && patientId) {
      fetchPatientData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, patientId]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch patient details
      const patientResponse = await axios.get(`http://localhost:5000/api/users/${patientId}`, { headers });
      setPatient(patientResponse.data);

      // Fetch medical history (appointments for this patient)
      const historyResponse = await axios.get(`http://localhost:5000/api/appointments`, { headers });
      const patientAppointments = historyResponse.data.filter((apt: any) => apt.patient._id === patientId);
      setMedicalHistory(patientAppointments);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content patient-profile-modal">
        <div className="modal-header">
          <h2>👤 Patient Profile</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Personal Info
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Medical History ({medicalHistory.length})
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : (
            <>
              {activeTab === 'profile' && patient && (
                <div className="patient-info">
                  <div className="info-grid">
                    <div className="info-card">
                      <h3>📋 Basic Information</h3>
                      <div className="info-row">
                        <span className="label">Name:</span>
                        <span className="value">{patient.name}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Email:</span>
                        <span className="value">{patient.email}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Phone:</span>
                        <span className="value">{patient.phone}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Address:</span>
                        <span className="value">{patient.address}</span>
                      </div>
                    </div>

                    <div className="info-card">
                      <h3>🩺 Medical Information</h3>
                      <div className="info-row">
                        <span className="label">Date of Birth:</span>
                        <span className="value">
                          {new Date(patient.dateOfBirth).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="label">Gender:</span>
                        <span className="value">{patient.gender}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Blood Group:</span>
                        <span className="value blood-group">{patient.bloodGroup}</span>
                      </div>
                    </div>

                    <div className="info-card">
                      <h3>🚨 Emergency Contact</h3>
                      <div className="info-row">
                        <span className="label">Name:</span>
                        <span className="value">{patient.emergencyContact?.name || 'Not provided'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Phone:</span>
                        <span className="value">{patient.emergencyContact?.phone || 'Not provided'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Relation:</span>
                        <span className="value">{patient.emergencyContact?.relation || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="medical-history">
                  {medicalHistory.length === 0 ? (
                    <div className="empty-state">
                      <p>No medical history available</p>
                    </div>
                  ) : (
                    <div className="history-list">
                      {medicalHistory.map((record) => (
                        <div key={record._id} className="history-card">
                          <div className="history-header">
                            <div className="history-date">
                              {new Date(record.appointmentDate).toLocaleDateString()}
                            </div>
                            <span className={`status-badge ${record.status}`}>
                              {record.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="history-details">
                            <p><strong>Doctor:</strong> Dr. {record.doctor.name} ({record.doctor.specialization})</p>
                            <p><strong>Department:</strong> {record.department.name}</p>
                            <p><strong>Reason:</strong> {record.reason}</p>
                            {record.notes && (
                              <p><strong>Notes:</strong> {record.notes}</p>
                            )}
                            {record.prescription && record.prescription.medicines.length > 0 && (
                              <div className="prescription-section">
                                <h4>💊 Prescription:</h4>
                                <ul className="medicines-list">
                                  {record.prescription.medicines.map((medicine, index) => (
                                    <li key={index}>
                                      <strong>{medicine.name}</strong>
                                      <span> - {medicine.dosage}, {medicine.frequency} for {medicine.duration}</span>
                                    </li>
                                  ))}
                                </ul>
                                {record.prescription.instructions && (
                                  <p><em>Instructions: {record.prescription.instructions}</em></p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
