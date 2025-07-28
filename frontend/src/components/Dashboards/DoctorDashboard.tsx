import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PatientProfile from './components/PatientProfile';
import AppointmentDetails from './components/AppointmentDetails';
import ScheduleManager from './components/ScheduleManager';
import VideoCall from '../VideoCall/VideoCall';
import Chat from '../Chat/Chat';
import CreateMeetingModal from '../VideoCall/CreateMeetingModal';
import JoinMeetingModal from '../VideoCall/JoinMeetingModal';
import SocketService from '../../services/socketService';

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

  // Video call and chat states
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentCallData, setCurrentCallData] = useState<any>(null);
  const [currentChatData, setCurrentChatData] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  
  // New video call system states
  const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(false);
  const [isJoinMeetingOpen, setIsJoinMeetingOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Initialize socket connection
      const socketService = SocketService.getInstance();
      socketService.connect(parsedUser._id, parsedUser.role, parsedUser.name);

      // Setup socket event listeners
      socketService.onIncomingCall((data) => {
        setIncomingCall(data);
      });

      socketService.onCallRejected(() => {
        setCurrentCallData(null);
        setIsVideoCallActive(false);
      });

      socketService.onCallEnded(() => {
        setCurrentCallData(null);
        setIsVideoCallActive(false);
      });

      // Handle video call start from chat
      window.addEventListener('startVideoCall', handleStartVideoCall);
    }
    fetchAppointments();

    return () => {
      window.removeEventListener('startVideoCall', handleStartVideoCall);
    };
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

  // Video call and chat handlers
  const startVideoCall = (appointment: Appointment) => {
    console.log('Starting video call');
    console.log('Appointment:', appointment);
    console.log('Current user:', user);
    
    if (!appointment.patient?._id) {
      console.error('Patient ID not found in appointment:', appointment);
      alert('Unable to start call - patient information not available');
      return;
    }
    
    const callData = {
      appointmentId: appointment._id,
      currentUserId: user?._id || '',
      currentUserName: user?.name || '',
      currentUserRole: user?.role || '',
      otherUserId: appointment.patient._id,
      otherUserName: appointment.patient.name,
      isInitiator: true
    };
    console.log('Call data:', callData);
    setCurrentCallData(callData);
    setIsVideoCallActive(true);
  };

  const startChat = (appointment: Appointment) => {
    console.log('Starting chat');
    console.log('Appointment:', appointment);
    
    if (!appointment.patient?._id) {
      console.error('Patient ID not found in appointment:', appointment);
      alert('Unable to start chat - patient information not available');
      return;
    }
    
    const chatData = {
      appointmentId: appointment._id,
      currentUserId: user?._id || '',
      currentUserName: user?.name || '',
      currentUserRole: user?.role || '',
      otherUserId: appointment.patient._id,
      otherUserName: appointment.patient.name,
      otherUserRole: 'patient'
    };
    console.log('Chat data:', chatData);
    setCurrentChatData(chatData);
    setIsChatOpen(true);
  };

  const handleStartVideoCall = (event: any) => {
    const { detail } = event;
    setCurrentCallData(detail);
    setIsVideoCallActive(true);
    setIsChatOpen(false);
  };

  const handleAnswerCall = () => {
    if (incomingCall && user) {
      const callData = {
        appointmentId: incomingCall.appointmentId,
        currentUserId: user._id,
        currentUserName: user.name,
        currentUserRole: user.role,
        otherUserId: incomingCall.callerId,
        otherUserName: incomingCall.callerName,
        isInitiator: false
      };
      setCurrentCallData(callData);
      setIsVideoCallActive(true);
      setIncomingCall(null);
    }
  };

  const handleRejectCall = () => {
    if (incomingCall) {
      const socketService = SocketService.getInstance();
      socketService.rejectCall(incomingCall.callerId);
      setIncomingCall(null);
    }
  };

  const closeVideoCall = () => {
    setIsVideoCallActive(false);
    setCurrentCallData(null);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setCurrentChatData(null);
  };

  const handleLogout = () => {
    const socketService = SocketService.getInstance();
    socketService.disconnect();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  // Video call handlers
  const handleMeetingCreated = (meetingId: string, meetingUrl: string) => {
    // Navigate to the meeting room
    window.open(`/video-call/${meetingId}`, '_blank');
    // Or copy meeting URL to clipboard
    navigator.clipboard.writeText(meetingUrl).then(() => {
      alert(`Meeting created! Meeting ID: ${meetingId}\nMeeting URL copied to clipboard.`);
    });
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
          <h1>👨‍⚕️ Doctor Portal</h1>
          <p>Welcome back, Dr. {user?.name}!</p>
          <p className="specialization">{user?.specialization} • Providing excellent patient care</p>
        </div>
        <div className="header-actions">
          <div className="dashboard-nav">
            <button
              className={`nav-btn ${activeView === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveView('overview')}
              title="View dashboard overview and statistics"
            >
              📊 Overview
            </button>
            <button
              className={`nav-btn ${activeView === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveView('appointments')}
              title="Manage all patient appointments"
            >
              📅 Appointments
            </button>
            <button
              className={`nav-btn ${activeView === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveView('schedule')}
              title="View and manage your schedule"
            >
              ⏰ Schedule
            </button>
          </div>
          <div className="user-info">
            <div className="user-avatar">👨‍⚕️</div>
            <div className="user-details">
              <span className="user-name">Dr. {user?.name}</span>
              <span className="user-role">{user?.specialization}</span>
            </div>
          </div>
          <button 
            className="secondary-btn"
            onClick={() => setIsScheduleManagerOpen(true)}
            title="Configure your availability and working hours"
          >
            ⚙️ Manage Schedule
          </button>
          <button onClick={handleLogout} className="logout-btn" title="Sign out of your account">
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Practice Overview Statistics */}
        <div className="dashboard-section">
          <h2>Practice Overview</h2>
          <p className="section-description">Monitor your patient care and appointment statistics</p>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>{appointments.length}</h3>
                <p>Total Appointments</p>
                <small>All scheduled consultations</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>{todayAppointments.length}</h3>
                <p>Today's Schedule</p>
                <small>Appointments for today</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{completedAppointments.length}</h3>
                <p>Completed</p>
                <small>Successfully finished consultations</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>{pendingAppointments.length}</h3>
                <p>Pending</p>
                <small>Awaiting consultation</small>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <div className="action-card">
              <div className="action-icon">📋</div>
              <h3>Patient Appointments</h3>
              <p>View and manage all patient appointments and consultations</p>
              <button 
                className="action-btn"
                onClick={() => setActiveView('appointments')}
              >
                View All Appointments
              </button>
            </div>
            <div className="action-card">
              <div className="action-icon">📹</div>
              <h3>Video Consultations</h3>
              <p>Start video meetings with patients or join existing consultations</p>
              <div className="action-buttons">
                <button 
                  className="action-btn primary"
                  onClick={() => setIsCreateMeetingOpen(true)}
                >
                  Start New Meeting
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => setIsJoinMeetingOpen(true)}
                >
                  Join Meeting
                </button>
              </div>
            </div>
            <div className="action-card">
              <div className="action-icon">📅</div>
              <h3>Schedule Management</h3>
              <p>Configure your availability, working hours, and time slots</p>
              <button 
                className="action-btn"
                onClick={() => setIsScheduleManagerOpen(true)}
              >
                Manage Schedule
              </button>
            </div>
            <div className="action-card">
              <div className="action-icon">📊</div>
              <h3>Practice Analytics</h3>
              <p>Review your consultation patterns and patient statistics</p>
              <button 
                className="action-btn"
                onClick={() => setActiveView('schedule')}
              >
                View Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Based on Active View */}
        {activeView === 'overview' && (
          <>
            <div className="dashboard-section">
              <h2>📋 Today's Patient Schedule</h2>
              <p className="section-description">Manage today's consultations and connect with your patients</p>
              
              {todayAppointments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h3>No appointments today</h3>
                  <p>You have a clear schedule today. Perfect time to catch up on administrative tasks!</p>
                </div>
              ) : (
                <div className="appointments-list">
                  {todayAppointments.map((appointment) => (
                    <div key={appointment._id} className="appointment-card enhanced doctor-view">
                      <div className="appointment-header">
                        <div className="patient-info">
                          <div className="patient-avatar">👤</div>
                          <div className="patient-details">
                            <h4 
                              className="clickable-patient-name"
                              onClick={() => openPatientProfile(appointment.patient._id)}
                              style={{ cursor: 'pointer', color: '#667eea' }}
                            >
                              {appointment.patient.name}
                            </h4>
                            <p className="patient-contact">📧 {appointment.patient.email}</p>
                            <p className="patient-contact">📞 {appointment.patient.phone}</p>
                          </div>
                        </div>
                        <span className={`status-badge ${appointment.status}`}>
                          {appointment.status === 'scheduled' ? 'Confirmed' : appointment.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="appointment-details">
                        <div className="detail-item">
                          <span className="detail-icon">⏰</span>
                          <span className="detail-text">Scheduled at {appointment.appointmentTime}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">💭</span>
                          <span className="detail-text">Consultation for: {appointment.reason}</span>
                        </div>
                        {appointment.notes && (
                          <div className="detail-item">
                            <span className="detail-icon">📝</span>
                            <span className="detail-text">Notes: {appointment.notes}</span>
                          </div>
                        )}
                      </div>

                      <div className="appointment-actions">
                        <div className="action-group">
                          <button 
                            className="action-btn secondary"
                            onClick={() => openAppointmentDetails(appointment._id)}
                            title="View complete patient information and appointment details"
                          >
                            📋 View Details
                          </button>
                          <button 
                            className="action-btn video-call"
                            onClick={() => startVideoCall(appointment)}
                            title="Start video consultation with patient"
                          >
                            📹 Start Call
                          </button>
                          <button 
                            className="action-btn chat"
                            onClick={() => startChat(appointment)}
                            title="Send message to patient"
                          >
                            💬 Message
                          </button>
                          {appointment.status === 'scheduled' && (
                            <>
                              <button 
                                className="action-btn"
                                onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                                style={{ background: '#28a745', color: 'white' }}
                                title="Mark consultation as completed"
                              >
                                ✅ Complete
                              </button>
                              <button 
                                className="action-btn"
                                onClick={() => updateAppointmentStatus(appointment._id, 'rescheduled')}
                                style={{ background: '#ffc107', color: '#212529' }}
                                title="Reschedule this appointment"
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
                      <button 
                        className="action-btn"
                        onClick={() => startVideoCall(appointment)}
                        style={{ background: '#28a745', color: 'white' }}
                        title="Start Video Call"
                      >
                        📹 Call
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => startChat(appointment)}
                        style={{ background: '#6f42c1', color: 'white' }}
                        title="Start Chat"
                      >
                        💬 Chat
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

      {/* Incoming Call Notification */}
      {incomingCall && (
        <div className="incoming-call-notification">
          <div className="incoming-call-content">
            <h3>📞 Incoming Call</h3>
            <p>From: {incomingCall.callerName}</p>
            <div className="incoming-call-actions">
              <button 
                className="answer-btn"
                onClick={handleAnswerCall}
              >
                📞 Answer
              </button>
              <button 
                className="reject-btn"
                onClick={handleRejectCall}
              >
                📞 Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Component */}
      {isVideoCallActive && currentCallData && (
        <VideoCall
          appointmentId={currentCallData.appointmentId}
          currentUserId={currentCallData.currentUserId}
          currentUserName={currentCallData.currentUserName}
          currentUserRole={currentCallData.currentUserRole}
          otherUserId={currentCallData.otherUserId}
          otherUserName={currentCallData.otherUserName}
          isInitiator={currentCallData.isInitiator}
          onClose={closeVideoCall}
        />
      )}

      {/* Chat Component */}
      {isChatOpen && currentChatData && (
        <div className="chat-overlay">
          <Chat
            appointmentId={currentChatData.appointmentId}
            currentUserId={currentChatData.currentUserId}
            currentUserName={currentChatData.currentUserName}
            currentUserRole={currentChatData.currentUserRole}
            otherUserId={currentChatData.otherUserId}
            otherUserName={currentChatData.otherUserName}
            otherUserRole={currentChatData.otherUserRole}
            onClose={closeChat}
          />
        </div>
      )}

      {/* New Video Call Modals */}
      <CreateMeetingModal
        isOpen={isCreateMeetingOpen}
        onClose={() => setIsCreateMeetingOpen(false)}
        onMeetingCreated={handleMeetingCreated}
      />

      <JoinMeetingModal
        isOpen={isJoinMeetingOpen}
        onClose={() => setIsJoinMeetingOpen(false)}
      />

    </div>
  );
};

export default EnhancedDoctorDashboard;
