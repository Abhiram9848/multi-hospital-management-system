import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PatientModals.css';

interface Prescription {
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  instructions: string;
}

interface Appointment {
  _id: string;
  doctor: {
    name: string;
    specialization: string;
  };
  department: {
    name: string;
  };
  appointmentDate: string;
  prescription: Prescription;
}

interface PrescriptionListProps {
  patientId: string;
  onClose: () => void;
}

const PrescriptionList: React.FC<PrescriptionListProps> = ({ patientId, onClose }) => {
  const [prescriptions, setPrescriptions] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPrescriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/prescriptions/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrescriptions(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (prescription: Appointment) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Prescription - ${prescription.doctor.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
              .patient-info, .doctor-info { margin-bottom: 20px; }
              .medicines { border: 1px solid #ccc; padding: 15px; }
              .medicine-item { border-bottom: 1px solid #eee; padding: 10px 0; }
              .medicine-item:last-child { border-bottom: none; }
              .instructions { margin-top: 20px; padding: 15px; background-color: #f9f9f9; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Medical Prescription</h1>
              <p>Date: ${new Date(prescription.appointmentDate).toLocaleDateString()}</p>
            </div>
            
            <div class="doctor-info">
              <h3>Doctor Information</h3>
              <p><strong>Name:</strong> Dr. ${prescription.doctor.name}</p>
              <p><strong>Specialization:</strong> ${prescription.doctor.specialization}</p>
              <p><strong>Department:</strong> ${prescription.department.name}</p>
            </div>

            <div class="medicines">
              <h3>Prescribed Medicines</h3>
              ${prescription.prescription.medicines.map(med => `
                <div class="medicine-item">
                  <p><strong>${med.name}</strong></p>
                  <p>Dosage: ${med.dosage}</p>
                  <p>Frequency: ${med.frequency}</p>
                  <p>Duration: ${med.duration}</p>
                </div>
              `).join('')}
            </div>

            ${prescription.prescription.instructions ? `
              <div class="instructions">
                <h3>Instructions</h3>
                <p>${prescription.prescription.instructions}</p>
              </div>
            ` : ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading">Loading prescriptions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content prescription-list-modal">
        <div className="modal-header">
          <h2>💊 My Prescriptions</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="prescription-content">
          {error && <div className="error-message">{error}</div>}

          {prescriptions.length === 0 ? (
            <div className="empty-state">
              <p>No prescriptions found.</p>
            </div>
          ) : (
            <div className="prescriptions-list">
              {prescriptions.map((appointment) => (
                <div key={appointment._id} className="prescription-card">
                  <div className="prescription-header">
                    <div className="doctor-info">
                      <h4>Dr. {appointment.doctor.name}</h4>
                      <p>{appointment.doctor.specialization}</p>
                      <p className="department">{appointment.department.name}</p>
                      <p className="date">
                        {new Date(appointment.appointmentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => handlePrint(appointment)}
                      className="print-btn"
                      title="Print Prescription"
                    >
                      🖨️ Print
                    </button>
                  </div>

                  <div className="medicines-section">
                    <h5>Medicines:</h5>
                    <div className="medicines-grid">
                      {appointment.prescription.medicines.map((medicine, index) => (
                        <div key={index} className="medicine-item">
                          <h6>{medicine.name}</h6>
                          <div className="medicine-details">
                            <span className="dosage">💊 {medicine.dosage}</span>
                            <span className="frequency">🕐 {medicine.frequency}</span>
                            <span className="duration">📅 {medicine.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {appointment.prescription.instructions && (
                    <div className="instructions-section">
                      <h5>Instructions:</h5>
                      <p>{appointment.prescription.instructions}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionList;
