import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PatientProfile from './components/PatientProfile';
import AppointmentDetails from './components/AppointmentDetails';
import ScheduleManager from './components/ScheduleManager';
import './Dashboard.css';
import './components/DoctorComponents.css';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  specialization?: string;
}

interface Appointment {
  _id: string;
  patient: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  department: {
    name: string;
  };
  appointmentDate: string;
  appointmentTime: string;
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

const EnhancedDoctorDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'appointments' | 'schedule'>('overview');
  
  // Modal states
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isPatientProfileOpen, setIsPatientProfileOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [isAppointmentDetailsOpen, setIsAppointmentDetailsOpen] = useState(false);
  const [isScheduleManagerOpen, setIsScheduleManagerOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchAppointments();
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

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/appointments/${appointmentId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const openPatientProfile = (patientId: string) => {
    setSelectedPatientId(patientId);
    setIsPatientProfileOpen(true);
  };

  const openAppointmentDetails = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setIsAppointmentDetailsOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const todayAppointments = appointments.filter(apt => {
    const today = new Date().toDateString();
    const aptDate = new Date(apt.appointmentDate).toDateString();
    return today === aptDate;
  });

  const completedAppointments = appointments.filter(apt => apt.status === 'completed');
  const pendingAppointments = appointments.filter(apt => apt.status === 'scheduled');

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>👨‍⚕️ Doctor Dashboard</h1>
          <p>Welcome back, Dr. {user?.name}!</p>
          <p className="specialization">{user?.specialization}</p>
        </div>
        <div className="header-actions">
          <div className="dashboard-nav">
            <button
              className={`nav-btn ${activeView === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveView('overview')}
            >
              📊 Overview
            </button>
            <button
              className={`nav-btn ${activeView === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveView('appointments')}
            >
              📅 Appointments
            </button>
            <button
              className={`nav-btn ${activeView === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveView('schedule')}
            >
              ⏰ Schedule
            </button>
          </div>
          <button 
            className="secondary-btn"
            onClick={() => setIsScheduleManagerOpen(true)}
          >
            ⚙️ Manage Schedule
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <h3>{appointments.length}</h3>
              <p>Total Appointments</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-info">
              <h3>{todayAppointments.length}</h3>
              <p>Today's Appointments</p>
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
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <h3>{pendingAppointments.length}</h3>
              <p>Pending</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button 
            className="primary-btn"
            onClick={() => setActiveView('appointments')}
          >
            📋 View All Appointments
          </button>
          <button 
            className="secondary-btn"
            onClick={() => setIsScheduleManagerOpen(true)}
          >
            📅 Manage Schedule
          </button>
        </div>

        {/* Main Content Based on Active View */}
        {activeView === 'overview' && (
          <>
            <div className="dashboard-section">
              <h2>Today's Appointments</h2>
              {todayAppointments.length === 0 ? (
                <div className="empty-state">
                  <p>No appointments scheduled for today.</p>
                </div>
              ) : (
                <div className="appointments-list">
                  {todayAppointments.map((appointment) => (
                    <div key={appointment._id} className="appointment-card doctor-card">
                      <div className="appointment-info">
                        <h4 
                          className="clickable-patient-name"
                          onClick={() => openPatientProfile(appointment.patient._id)}
                          style={{ cursor: 'pointer', color: '#667eea' }}
                        >
                          👤 {appointment.patient.name}
                        </h4>
                        <p className="patient-contact">{appointment.patient.email}</p>
                        <p className="patient-contact">{appointment.patient.phone}</p>
                        <p className="date-time">⏰ {appointment.appointmentTime}</p>
                        <p className="reason">💭 {appointment.reason}</p>
                        {appointment.notes && (
                          <p className="notes">📝 Notes: {appointment.notes}</p>
                        )}
                      </div>
                      <div className="appointment-actions">
                        <span className={`status-badge ${appointment.status}`}>
                          {appointment.status.toUpperCase()}
                        </span>
                        <div className="action-buttons">
                          <button 
                            className="action-btn"
                            onClick={() => openAppointmentDetails(appointment._id)}
                            style={{ background: '#17a2b8', color: 'white' }}
                          >
                            📋 Details
                          </button>
                          {appointment.status === 'scheduled' && (
                            <>
                              <button 
                                className="action-btn complete"
                                onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                              >
                                ✅ Complete
                              </button>
                              <button 
                                className="action-btn reschedule"
                                onClick={() => updateAppointmentStatus(appointment._id, 'rescheduled')}
                              >
                                📅 Reschedule
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="dashboard-section">
              <h2>Recent Activity</h2>
              <div className="activity-list">
                {appointments.slice(0, 5).map((appointment) => (
                  <div key={appointment._id} className="activity-item">
                    <div className="activity-icon">
                      {appointment.status === 'completed' ? '✅' : 
                       appointment.status === 'scheduled' ? '📅' : '📋'}
                    </div>
                    <div className="activity-info">
                      <p>
                        {appointment.status === 'completed' ? 'Completed appointment with' : 'Appointment scheduled with'} {appointment.patient.name}
                      </p>
                      <p className="activity-time">
                        {new Date(appointment.appointmentDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeView === 'appointments' && (
          <div className="dashboard-section">
            <h2>All Appointments</h2>
            <div className="appointments-list">
              {appointments.map((appointment) => (
                <div key={appointment._id} className="appointment-card doctor-card">
                  <div className="appointment-info">
                    <h4 
                      className="clickable-patient-name"
                      onClick={() => openPatientProfile(appointment.patient._id)}
                      style={{ cursor: 'pointer', color: '#667eea' }}
                    >
                      👤 {appointment.patient.name}
                    </h4>
                    <p className="patient-contact">📧 {appointment.patient.email}</p>
                    <p className="patient-contact">📞 {appointment.patient.phone}</p>
                    <p className="date-time">
                      📅 {new Date(appointment.appointmentDate).toLocaleDateString()} at ⏰ {appointment.appointmentTime}
                    </p>
                    <p className="reason">💭 {appointment.reason}</p>
                    {appointment.notes && (
                      <p className="notes">📝 Notes: {appointment.notes}</p>
                    )}
                    {appointment.prescription && appointment.prescription.medicines.length > 0 && (
                      <p className="prescription-indicator">💊 Prescription added</p>
                    )}
                  </div>
                  <div className="appointment-actions">
                    <span className={`status-badge ${appointment.status}`}>
                      {appointment.status.toUpperCase()}
                    </span>
                    <div className="action-buttons">
                      <button 
                        className="action-btn"
                        onClick={() => openAppointmentDetails(appointment._id)}
                        style={{ background: '#17a2b8', color: 'white' }}
                      >
                        📋 View Details
                      </button>
                      {appointment.status === 'scheduled' && (
                        <>
                          <button 
                            className="action-btn complete"
                            onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                          >
                            ✅ Complete
                          </button>
                          <button 
                            className="action-btn reschedule"
                            onClick={() => updateAppointmentStatus(appointment._id, 'rescheduled')}
                          >
                            📅 Reschedule
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'schedule' && (
          <div className="dashboard-section">
            <h2>Schedule Overview</h2>
            <div className="schedule-overview">
              <div className="schedule-stats">
                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-info">
                    <h3>{todayAppointments.length}</h3>
                    <p>Today's Appointments</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⏰</div>
                  <div className="stat-info">
                    <h3>9:00 - 17:00</h3>
                    <p>Working Hours</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <h3>{Math.round((completedAppointments.length / appointments.length) * 100)}%</h3>
                    <p>Completion Rate</p>
                  </div>
                </div>
              </div>
              
              <div className="schedule-actions-section">
                <button 
                  className="primary-btn"
                  onClick={() => setIsScheduleManagerOpen(true)}
                >
                  ⚙️ Manage Schedule & Availability
                </button>
              </div>

              <div className="upcoming-appointments">
                <h3>Upcoming Appointments</h3>
                {appointments
                  .filter(apt => new Date(apt.appointmentDate) >= new Date() && apt.status === 'scheduled')
                  .slice(0, 5)
                  .map((appointment) => (
                    <div key={appointment._id} className="appointment-card">
                      <div className="appointment-info">
                        <h4>{appointment.patient.name}</h4>
                        <p className="date-time">
                          {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                        </p>
                        <p className="reason">{appointment.reason}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <PatientProfile
        patientId={selectedPatientId || ''}
        isOpen={isPatientProfileOpen}
        onClose={() => {
          setIsPatientProfileOpen(false);
          setSelectedPatientId(null);
        }}
      />

      <AppointmentDetails
        appointmentId={selectedAppointmentId}
        isOpen={isAppointmentDetailsOpen}
        onClose={() => {
          setIsAppointmentDetailsOpen(false);
          setSelectedAppointmentId(null);
        }}
        onUpdate={fetchAppointments}
      />

      <ScheduleManager
        isOpen={isScheduleManagerOpen}
        onClose={() => setIsScheduleManagerOpen(false)}
      />
    </div>
  );
};

export default EnhancedDoctorDashboard;
