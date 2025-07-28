import React, { useState } from 'react';
import './PatientModals.css';

interface Appointment {
  _id: string;
  doctor: {
    _id: string;
    name: string;
    specialization: string;
  };
  department: {
    _id: string;
    name: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  reason: string;
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

interface AppointmentDetailsProps {
  appointment: Appointment;
  onClose: () => void;
  onAppointmentAction: (appointmentId: string, action: 'cancel' | 'reschedule') => void;
}

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({ 
  appointment, 
  onClose, 
  onAppointmentAction 
}) => {
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [doctorRating, setDoctorRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showRatingForm, setShowRatingForm] = useState(false);

  const isUpcoming = appointment.status === 'scheduled' && new Date(appointment.appointmentDate) >= new Date();
  const isCompleted = appointment.status === 'completed';

  const handleCancelAppointment = () => {
    onAppointmentAction(appointment._id, 'cancel');
    onClose();
  };

  const handleSubmitRating = () => {
    // This would typically send the rating to the backend
    console.log('Rating submitted:', { doctorRating, feedback });
    setShowRatingForm(false);
    // You could add an API call here to save the rating
  };

  const renderStars = (rating: number, onStarClick?: (star: number) => void) => {
    return [...Array(5)].map((_, index) => (
      <span 
        key={index}
        className={`star ${index < rating ? 'filled' : ''}`}
        onClick={() => onStarClick && onStarClick(index + 1)}
        style={{ cursor: onStarClick ? 'pointer' : 'default' }}
      >
        ⭐
      </span>
    ));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content appointment-details-modal">
        <div className="modal-header">
          <h2>📋 Appointment Details</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="appointment-details-content">
          <div className="detail-section">
            <h3>Doctor Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Doctor:</label>
                <span>Dr. {appointment.doctor.name}</span>
              </div>
              <div className="info-item">
                <label>Specialization:</label>
                <span>{appointment.doctor.specialization}</span>
              </div>
              <div className="info-item">
                <label>Department:</label>
                <span>{appointment.department.name}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>Appointment Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Date:</label>
                <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <label>Time:</label>
                <span>{appointment.appointmentTime}</span>
              </div>
              <div className="info-item">
                <label>Status:</label>
                <span className={`status-badge ${appointment.status}`}>
                  {appointment.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>Reason for Visit</h3>
            <p className="reason-text">{appointment.reason}</p>
          </div>

          {appointment.prescription && (
            <div className="detail-section">
              <h3>Prescription</h3>
              <div className="prescription-details">
                <div className="medicines-list">
                  <h4>Medicines:</h4>
                  {appointment.prescription.medicines.map((medicine, index) => (
                    <div key={index} className="medicine-detail">
                      <strong>{medicine.name}</strong>
                      <div className="medicine-info">
                        <span>💊 {medicine.dosage}</span>
                        <span>🕐 {medicine.frequency}</span>
                        <span>📅 {medicine.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {appointment.prescription.instructions && (
                  <div className="prescription-instructions">
                    <h4>Instructions:</h4>
                    <p>{appointment.prescription.instructions}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="detail-actions">
            {isUpcoming && (
              <>
                <button 
                  onClick={() => setShowConfirmCancel(true)}
                  className="cancel-appointment-btn"
                >
                  Cancel Appointment
                </button>
                {/* Future: Add reschedule functionality */}
              </>
            )}

            {isCompleted && !showRatingForm && (
              <button 
                onClick={() => setShowRatingForm(true)}
                className="rate-doctor-btn"
              >
                Rate Doctor
              </button>
            )}
          </div>

          {showRatingForm && (
            <div className="rating-form">
              <h3>Rate Your Experience</h3>
              <div className="rating-section">
                <label>Doctor Rating:</label>
                <div className="stars-container">
                  {renderStars(doctorRating, setDoctorRating)}
                </div>
              </div>
              <div className="feedback-section">
                <label>Feedback (Optional):</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your experience with the doctor..."
                  rows={4}
                />
              </div>
              <div className="rating-actions">
                <button 
                  onClick={() => setShowRatingForm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmitRating}
                  className="submit-btn"
                  disabled={doctorRating === 0}
                >
                  Submit Rating
                </button>
              </div>
            </div>
          )}

          {showConfirmCancel && (
            <div className="confirm-dialog">
              <h4>Confirm Cancellation</h4>
              <p>Are you sure you want to cancel this appointment?</p>
              <div className="confirm-actions">
                <button 
                  onClick={() => setShowConfirmCancel(false)}
                  className="cancel-btn"
                >
                  No, Keep It
                </button>
                <button 
                  onClick={handleCancelAppointment}
                  className="confirm-cancel-btn"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;
