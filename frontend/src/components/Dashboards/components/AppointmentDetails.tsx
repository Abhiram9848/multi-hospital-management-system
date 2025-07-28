import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AppointmentDetailsProps {
  appointmentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface AppointmentDetail {
  _id: string;
  patient: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    bloodGroup: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relation: string;
    };
  };
  doctor: {
    name: string;
    specialization: string;
    qualification: string;
  };
  department: {
    name: string;
  };
  appointmentDate: string;
  appointmentTime: string;
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
  fee: number;
  paymentStatus: string;
}

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({
  appointmentId,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'prescription'>('details');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '', frequency: '', duration: '' }
  ]);
  const [prescriptionInstructions, setPrescriptionInstructions] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && appointmentId) {
      fetchAppointmentDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, appointmentId]);

  const fetchAppointmentDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/appointments/${appointmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAppointment(response.data);
      setNotes(response.data.notes || '');
      
      if (response.data.prescription) {
        setMedicines(response.data.prescription.medicines.length > 0 
          ? response.data.prescription.medicines 
          : [{ name: '', dosage: '', frequency: '', duration: '' }]
        );
        setPrescriptionInstructions(response.data.prescription.instructions || '');
      }
    } catch (error) {
      console.error('Error fetching appointment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const removeMedicine = (index: number) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((_, i) => i !== index));
    }
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    const updatedMedicines = medicines.map((medicine, i) => 
      i === index ? { ...medicine, [field]: value } : medicine
    );
    setMedicines(updatedMedicines);
  };

  const saveNotes = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/appointments/${appointmentId}`,
        { notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdate();
      fetchAppointmentDetails();
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setUpdating(false);
    }
  };

  const savePrescription = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const validMedicines = medicines.filter(med => med.name.trim() !== '');
      
      await axios.put(
        `http://localhost:5000/api/appointments/${appointmentId}`,
        {
          prescription: {
            medicines: validMedicines,
            instructions: prescriptionInstructions
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdate();
      fetchAppointmentDetails();
    } catch (error) {
      console.error('Error saving prescription:', error);
    } finally {
      setUpdating(false);
    }
  };

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/appointments/${appointmentId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdate();
      fetchAppointmentDetails();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content appointment-details-modal">
        <div className="modal-header">
          <h2>📋 Appointment Details</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Patient Info
          </button>
          <button
            className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            Consultation Notes
          </button>
          <button
            className={`tab-btn ${activeTab === 'prescription' ? 'active' : ''}`}
            onClick={() => setActiveTab('prescription')}
          >
            Prescription
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : (
            <>
              {activeTab === 'details' && (
                <div className="appointment-info-section">
                  <div className="appointment-header-info">
                    <div className="appointment-meta">
                      <h3>{appointment.patient.name}</h3>
                      <p>📅 {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}</p>
                      <p>🏥 {appointment.department.name}</p>
                      <p>💭 <strong>Reason:</strong> {appointment.reason}</p>
                      <span className={`status-badge ${appointment.status}`}>
                        {appointment.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="patient-details-grid">
                    <div className="detail-card">
                      <h4>👤 Patient Information</h4>
                      <div className="detail-row">
                        <span>Email:</span>
                        <span>{appointment.patient.email}</span>
                      </div>
                      <div className="detail-row">
                        <span>Phone:</span>
                        <span>{appointment.patient.phone}</span>
                      </div>
                      <div className="detail-row">
                        <span>Date of Birth:</span>
                        <span>{new Date(appointment.patient.dateOfBirth).toLocaleDateString()}</span>
                      </div>
                      <div className="detail-row">
                        <span>Gender:</span>
                        <span>{appointment.patient.gender}</span>
                      </div>
                      <div className="detail-row">
                        <span>Blood Group:</span>
                        <span className="blood-group">{appointment.patient.bloodGroup}</span>
                      </div>
                    </div>

                    {appointment.patient.emergencyContact && (
                      <div className="detail-card">
                        <h4>🚨 Emergency Contact</h4>
                        <div className="detail-row">
                          <span>Name:</span>
                          <span>{appointment.patient.emergencyContact.name}</span>
                        </div>
                        <div className="detail-row">
                          <span>Phone:</span>
                          <span>{appointment.patient.emergencyContact.phone}</span>
                        </div>
                        <div className="detail-row">
                          <span>Relation:</span>
                          <span>{appointment.patient.emergencyContact.relation}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {appointment.status === 'scheduled' && (
                    <div className="status-actions">
                      <button
                        className="action-btn complete"
                        onClick={() => updateStatus('completed')}
                        disabled={updating}
                      >
                        ✅ Mark as Completed
                      </button>
                      <button
                        className="action-btn reschedule"
                        onClick={() => updateStatus('rescheduled')}
                        disabled={updating}
                      >
                        📅 Reschedule
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="notes-section">
                  <h4>📝 Consultation Notes</h4>
                  <textarea
                    className="notes-textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add consultation notes, observations, diagnosis, treatment plan..."
                    rows={10}
                  />
                  <button
                    className="primary-btn"
                    onClick={saveNotes}
                    disabled={updating}
                  >
                    {updating ? 'Saving...' : '💾 Save Notes'}
                  </button>
                </div>
              )}

              {activeTab === 'prescription' && (
                <div className="prescription-section">
                  <h4>💊 Prescription</h4>
                  
                  <div className="medicines-section">
                    <h5>Medicines:</h5>
                    {medicines.map((medicine, index) => (
                      <div key={index} className="medicine-row">
                        <input
                          type="text"
                          placeholder="Medicine name"
                          value={medicine.name}
                          onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Dosage"
                          value={medicine.dosage}
                          onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Frequency"
                          value={medicine.frequency}
                          onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Duration"
                          value={medicine.duration}
                          onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                        />
                        {medicines.length > 1 && (
                          <button
                            className="remove-medicine-btn"
                            onClick={() => removeMedicine(index)}
                          >
                            ❌
                          </button>
                        )}
                      </div>
                    ))}
                    
                    <button className="add-medicine-btn" onClick={addMedicine}>
                      ➕ Add Medicine
                    </button>
                  </div>

                  <div className="instructions-section">
                    <h5>Instructions:</h5>
                    <textarea
                      className="instructions-textarea"
                      value={prescriptionInstructions}
                      onChange={(e) => setPrescriptionInstructions(e.target.value)}
                      placeholder="Add special instructions, diet recommendations, follow-up notes..."
                      rows={4}
                    />
                  </div>

                  <button
                    className="primary-btn"
                    onClick={savePrescription}
                    disabled={updating}
                  >
                    {updating ? 'Saving...' : '💾 Save Prescription'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;
