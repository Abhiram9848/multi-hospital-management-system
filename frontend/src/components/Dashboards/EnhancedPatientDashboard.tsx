import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';
import BookAppointment from './Patient/BookAppointment';
import ProfileEdit from './Patient/ProfileEdit';
import PrescriptionList from './Patient/PrescriptionList';
import AppointmentDetails from './Patient/AppointmentDetails';
import MedicalHistory from './Patient/MedicalHistory';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
}

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

const PatientDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchAppointments();
    fetchUserProfile();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const openModal = (modalType: string, appointment?: Appointment) => {
    setActiveModal(modalType);
    if (appointment) {
      setSelectedAppointment(appointment);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedAppointment(null);
  };

  const handleAppointmentBooked = () => {
    fetchAppointments();
    closeModal();
  };

  const handleProfileUpdated = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    closeModal();
  };

  const handleAppointmentAction = async (appointmentId: string, action: 'cancel' | 'reschedule') => {
    try {
      const token = localStorage.getItem('token');
      if (action === 'cancel') {
        await axios.put(`http://localhost:5000/api/appointments/${appointmentId}`, 
          { status: 'cancelled' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      fetchAppointments();
    } catch (error) {
      console.error(`Error ${action}ing appointment:`, error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const upcomingAppointments = appointments.filter(apt => 
    apt.status === 'scheduled' && new Date(apt.appointmentDate) >= new Date()
  );
  const completedAppointments = appointments.filter(apt => apt.status === 'completed');
  const prescriptionsCount = appointments.filter(apt => apt.prescription?.medicines?.length).length;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>🏥 Patient Dashboard</h1>
          <p>Welcome back, {user?.name}!</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => openModal('profile')} 
            className="secondary-btn"
          >
            Edit Profile
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Quick Actions */}
        <div className="quick-actions">
          <button 
            onClick={() => openModal('book-appointment')} 
            className="primary-btn"
          >
            📅 Book Appointment
          </button>
          <button 
            onClick={() => openModal('prescriptions')} 
            className="secondary-btn"
          >
            💊 My Prescriptions
          </button>
          <button 
            onClick={() => openModal('medical-history')} 
            className="secondary-btn"
          >
            📋 Medical History
          </button>
        </div>

        {/* Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <h3>{appointments.length}</h3>
              <p>Total Appointments</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-info">
              <h3>{upcomingAppointments.length}</h3>
              <p>Upcoming</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{completedAppointments.length}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💊</div>
            <div className="stat-info">
              <h3>{prescriptionsCount}</h3>
              <p>Prescriptions</p>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="dashboard-section">
          <h2>Upcoming Appointments</h2>
          {upcomingAppointments.length === 0 ? (
            <div className="empty-state">
              <p>No upcoming appointments. Book your next appointment!</p>
              <button 
                onClick={() => openModal('book-appointment')} 
                className="primary-btn"
              >
                Book Appointment
              </button>
            </div>
          ) : (
            <div className="appointments-list">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment._id} className="appointment-card">
                  <div className="appointment-info">
                    <h4>Dr. {appointment.doctor.name}</h4>
                    <p className="specialization">{appointment.doctor.specialization}</p>
                    <p className="department">{appointment.department.name}</p>
                    <p className="date-time">
                      {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                    </p>
                    <p className="reason">Reason: {appointment.reason}</p>
                  </div>
                  <div className="appointment-actions">
                    <span className={`status-badge ${appointment.status}`}>
                      {appointment.status.toUpperCase()}
                    </span>
                    <div className="action-buttons">
                      <button 
                        onClick={() => openModal('appointment-details', appointment)}
                        className="view-btn"
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button 
                        onClick={() => handleAppointmentAction(appointment._id, 'cancel')}
                        className="cancel-btn"
                        title="Cancel Appointment"
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Appointments */}
        <div className="dashboard-section">
          <h2>Recent Appointments</h2>
          {completedAppointments.length === 0 ? (
            <div className="empty-state">
              <p>No completed appointments yet.</p>
            </div>
          ) : (
            <div className="appointments-list">
              {completedAppointments.slice(0, 3).map((appointment) => (
                <div key={appointment._id} className="appointment-card">
                  <div className="appointment-info">
                    <h4>Dr. {appointment.doctor.name}</h4>
                    <p className="specialization">{appointment.doctor.specialization}</p>
                    <p className="department">{appointment.department.name}</p>
                    <p className="date-time">
                      {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                    </p>
                  </div>
                  <div className="appointment-actions">
                    <span className={`status-badge ${appointment.status}`}>
                      {appointment.status.toUpperCase()}
                    </span>
                    <button 
                      onClick={() => openModal('appointment-details', appointment)}
                      className="view-btn"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'book-appointment' && (
        <BookAppointment
          onClose={closeModal}
          onAppointmentBooked={handleAppointmentBooked}
        />
      )}

      {activeModal === 'profile' && user && (
        <ProfileEdit
          user={user}
          onClose={closeModal}
          onProfileUpdated={handleProfileUpdated}
        />
      )}

      {activeModal === 'prescriptions' && user && (
        <PrescriptionList
          patientId={user._id}
          onClose={closeModal}
        />
      )}

      {activeModal === 'appointment-details' && selectedAppointment && (
        <AppointmentDetails
          appointment={selectedAppointment}
          onClose={closeModal}
          onAppointmentAction={handleAppointmentAction}
        />
      )}

      {activeModal === 'medical-history' && user && (
        <MedicalHistory
          patientId={user._id}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default PatientDashboard;
