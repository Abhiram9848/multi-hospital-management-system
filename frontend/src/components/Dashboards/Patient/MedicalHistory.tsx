import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PatientModals.css';

interface MedicalRecord {
  _id: string;
  doctor: {
    name: string;
    specialization: string;
  };
  department: {
    name: string;
  };
  appointmentDate: string;
  reason: string;
  status: string;
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

interface MedicalHistoryProps {
  patientId: string;
  onClose: () => void;
}

const MedicalHistory: React.FC<MedicalHistoryProps> = ({ patientId, onClose }) => {
  const [medicalHistory, setMedicalHistory] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchMedicalHistory();
  }, [patientId]);

  const fetchMedicalHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/appointments/medical-records', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMedicalHistory(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load medical history');
    } finally {
      setLoading(false);
    }
  };

  const downloadRecord = (record: MedicalRecord) => {
    const content = `
MEDICAL RECORD
==============

Date: ${new Date(record.appointmentDate).toLocaleDateString()}
Doctor: Dr. ${record.doctor.name}
Specialization: ${record.doctor.specialization}
Department: ${record.department.name}

Reason for Visit:
${record.reason}

${record.notes ? `
Doctor's Notes:
${record.notes}
` : ''}

${record.prescription ? `
Prescribed Medicines:
${record.prescription.medicines.map(med => 
  `- ${med.name} (${med.dosage}) - ${med.frequency} for ${med.duration}`
).join('\n')}

${record.prescription.instructions ? `
Instructions:
${record.prescription.instructions}
` : ''}
` : 'No prescription provided.'}

Generated on: ${new Date().toLocaleDateString()}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-record-${new Date(record.appointmentDate).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const filteredHistory = medicalHistory.filter(record => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'with-prescription') return record.prescription?.medicines?.length;
    if (filterStatus === 'without-prescription') return !record.prescription?.medicines?.length;
    return true;
  });

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading">Loading medical history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content medical-history-modal">
        <div className="modal-header">
          <h2>📋 Medical History</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="medical-history-content">
          {error && <div className="error-message">{error}</div>}

          <div className="history-filters">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Records</option>
              <option value="with-prescription">With Prescription</option>
              <option value="without-prescription">Without Prescription</option>
            </select>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="empty-state">
              <p>No medical records found.</p>
            </div>
          ) : (
            <div className="medical-records-list">
              {filteredHistory.map((record) => (
                <div key={record._id} className="medical-record-card">
                  <div className="record-header">
                    <h4>{new Date(record.appointmentDate).toLocaleDateString()}</h4>
                    <div className="record-actions">
                      <button 
                        onClick={() => setSelectedRecord(record)}
                        className="view-details-btn"
                        title="View Full Details"
                      >
                        👁️
                      </button>
                      <button 
                        onClick={() => downloadRecord(record)}
                        className="download-btn"
                        title="Download Record"
                      >
                        💾
                      </button>
                    </div>
                  </div>

                  <div className="record-summary">
                    <div className="doctor-info">
                      <h5>Dr. {record.doctor.name}</h5>
                      <p>{record.doctor.specialization}</p>
                      <p className="department">{record.department.name}</p>
                    </div>

                    <div className="visit-info">
                      <p className="reason"><strong>Reason:</strong> {record.reason}</p>
                      {record.prescription && record.prescription.medicines.length > 0 && (
                        <div className="prescription-summary">
                          <p><strong>Prescribed Medicines:</strong></p>
                          <ul>
                            {record.prescription.medicines.slice(0, 2).map((med, index) => (
                              <li key={index}>{med.name} - {med.dosage}</li>
                            ))}
                            {record.prescription.medicines.length > 2 && (
                              <li>... and {record.prescription.medicines.length - 2} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedRecord && (
          <div className="record-detail-overlay">
            <div className="record-detail-content">
              <div className="record-detail-header">
                <h3>Medical Record Details</h3>
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="close-btn"
                >
                  &times;
                </button>
              </div>

              <div className="record-detail-body">
                <div className="detail-section">
                  <h4>Appointment Information</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Date:</label>
                      <span>{new Date(selectedRecord.appointmentDate).toLocaleDateString()}</span>
                    </div>
                    <div className="info-item">
                      <label>Doctor:</label>
                      <span>Dr. {selectedRecord.doctor.name}</span>
                    </div>
                    <div className="info-item">
                      <label>Specialization:</label>
                      <span>{selectedRecord.doctor.specialization}</span>
                    </div>
                    <div className="info-item">
                      <label>Department:</label>
                      <span>{selectedRecord.department.name}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Reason for Visit</h4>
                  <p>{selectedRecord.reason}</p>
                </div>

                {selectedRecord.notes && (
                  <div className="detail-section">
                    <h4>Doctor's Notes</h4>
                    <p>{selectedRecord.notes}</p>
                  </div>
                )}

                {selectedRecord.prescription && selectedRecord.prescription.medicines.length > 0 && (
                  <div className="detail-section">
                    <h4>Prescription</h4>
                    <div className="medicines-detail">
                      {selectedRecord.prescription.medicines.map((medicine, index) => (
                        <div key={index} className="medicine-item">
                          <h5>{medicine.name}</h5>
                          <div className="medicine-details">
                            <span>💊 {medicine.dosage}</span>
                            <span>🕐 {medicine.frequency}</span>
                            <span>📅 {medicine.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedRecord.prescription.instructions && (
                      <div className="instructions">
                        <h5>Instructions:</h5>
                        <p>{selectedRecord.prescription.instructions}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="detail-actions">
                  <button 
                    onClick={() => downloadRecord(selectedRecord)}
                    className="download-btn"
                  >
                    💾 Download Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalHistory;
