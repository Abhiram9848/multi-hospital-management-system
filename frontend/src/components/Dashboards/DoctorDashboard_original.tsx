import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

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
}

const DoctorDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>👨‍⚕️ Doctor Dashboard</h1>
          <p>Welcome back, Dr. {user?.name}!</p>
          <p className="specialization">{user?.specialization}</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="dashboard-content">
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
              <h3>{appointments.filter(apt => apt.status === 'completed').length}</h3>
              <p>Completed</p>
            </div>
          </div>
        </div>

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
                    <h4>{appointment.patient.name}</h4>
                    <p className="patient-contact">{appointment.patient.email}</p>
                    <p className="patient-contact">{appointment.patient.phone}</p>
                    <p className="date-time">
                      {appointment.appointmentTime}
                    </p>
                    <p className="reason">Reason: {appointment.reason}</p>
                  </div>
                  <div className="appointment-actions">
                    <span className={`status-badge ${appointment.status}`}>
                      {appointment.status.toUpperCase()}
                    </span>
                    {appointment.status === 'scheduled' && (
                      <div className="action-buttons">
                        <button 
                          className="action-btn complete"
                          onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                        >
                          Mark Complete
                        </button>
                        <button 
                          className="action-btn reschedule"
                          onClick={() => updateAppointmentStatus(appointment._id, 'rescheduled')}
                        >
                          Reschedule
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <h2>All Appointments</h2>
          <div className="appointments-list">
            {appointments.map((appointment) => (
              <div key={appointment._id} className="appointment-card doctor-card">
                <div className="appointment-info">
                  <h4>{appointment.patient.name}</h4>
                  <p className="patient-contact">{appointment.patient.email}</p>
                  <p className="date-time">
                    {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                  </p>
                  <p className="reason">Reason: {appointment.reason}</p>
                </div>
                <div className="appointment-status">
                  <span className={`status-badge ${appointment.status}`}>
                    {appointment.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
