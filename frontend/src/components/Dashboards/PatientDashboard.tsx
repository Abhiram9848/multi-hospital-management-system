import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SocketService from '../../services/socketService';
import VideoCall from '../VideoCall/VideoCall';
import Chat from '../Chat/Chat';

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

  // Video call and chat states
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentCallData, setCurrentCallData] = useState<any>(null);
  const [currentChatData, setCurrentChatData] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

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
    fetchUserProfile();

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

  // Video call and chat handlers
  const startVideoCall = (appointment: Appointment) => {
    console.log('Starting video call');
    console.log('Appointment:', appointment);
    console.log('Current user:', user);
    
    if (!appointment.doctor?._id) {
      console.error('Doctor ID not found in appointment:', appointment);
      alert('Unable to start call - doctor information not available');
      return;
    }
    
    const callData = {
      appointmentId: appointment._id,
      currentUserId: user?._id || '',
      currentUserName: user?.name || '',
      currentUserRole: user?.role || '',
      otherUserId: appointment.doctor._id,
      otherUserName: appointment.doctor.name,
      isInitiator: true
    };
    console.log('Call data:', callData);
    setCurrentCallData(callData);
    setIsVideoCallActive(true);
  };

  const startChat = (appointment: Appointment) => {
    console.log('Starting chat');
    console.log('Appointment:', appointment);
    
    if (!appointment.doctor?._id) {
      console.error('Doctor ID not found in appointment:', appointment);
      alert('Unable to start chat - doctor information not available');
      return;
    }
    
    const chatData = {
      appointmentId: appointment._id,
      currentUserId: user?._id || '',
      currentUserName: user?.name || '',
      currentUserRole: user?.role || '',
      otherUserId: appointment.doctor._id,
      otherUserName: appointment.doctor.name,
      otherUserRole: 'doctor'
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
          <h1>🏥 Patient Portal</h1>
          <p>Welcome back, {user?.name}!</p>
          <p className="subtitle">Manage your healthcare journey in one place</p>
        </div>
        <div className="header-actions">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">Patient</span>
            </div>
          </div>
          <button 
            onClick={() => openModal('profile')} 
            className="secondary-btn"
            title="Update your personal information and medical details"
          >
            ✏️ Edit Profile
          </button>
          <button onClick={handleLogout} className="logout-btn" title="Sign out of your account">
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Quick Actions - Enhanced with descriptions */}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <div className="action-card">
              <div className="action-icon">📅</div>
              <h3>Book New Appointment</h3>
              <p>Schedule a consultation with your preferred doctor or specialist</p>
              <button 
                onClick={() => openModal('book-appointment')} 
                className="action-btn"
              >
                Book Appointment
              </button>
            </div>
            <div className="action-card">
              <div className="action-icon">💊</div>
              <h3>My Prescriptions</h3>
              <p>View all your prescribed medications and dosage instructions</p>
              <button 
                onClick={() => openModal('prescriptions')} 
                className="action-btn"
              >
                View Prescriptions
              </button>
            </div>
            <div className="action-card">
              <div className="action-icon">📋</div>
              <h3>Medical History</h3>
              <p>Access your complete medical records and previous consultations</p>
              <button 
                onClick={() => openModal('medical-history')} 
                className="action-btn"
              >
                View History
              </button>
            </div>
          </div>
        </div>

        {/* Health Overview Statistics */}
        <div className="dashboard-section">
          <h2>Your Health Overview</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>{appointments.length}</h3>
                <p>Total Appointments</p>
                <small>All your scheduled consultations</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏰</div>
              <div className="stat-info">
                <h3>{upcomingAppointments.length}</h3>
                <p>Upcoming Visits</p>
                <small>Scheduled appointments ahead</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{completedAppointments.length}</h3>
                <p>Completed Visits</p>
                <small>Successfully finished consultations</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💊</div>
              <div className="stat-info">
                <h3>{prescriptionsCount}</h3>
                <p>Active Prescriptions</p>
                <small>Current medication records</small>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="dashboard-section">
          <h2>📅 Your Upcoming Appointments</h2>
          <p className="section-description">Manage your scheduled visits and communicate with your healthcare providers</p>
          
          {upcomingAppointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No upcoming appointments</h3>
              <p>Ready to schedule your next healthcare visit? Our doctors are here to help!</p>
              <button 
                onClick={() => openModal('book-appointment')} 
                className="primary-btn"
              >
                📅 Book Your First Appointment
              </button>
            </div>
          ) : (
            <div className="appointments-list">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment._id} className="appointment-card enhanced">
                  <div className="appointment-header">
                    <div className="doctor-info">
                      <div className="doctor-avatar">👨‍⚕️</div>
                      <div className="doctor-details">
                        <h4>Dr. {appointment.doctor.name}</h4>
                        <p className="specialization">{appointment.doctor.specialization}</p>
                        <p className="department">{appointment.department.name} Department</p>
                      </div>
                    </div>
                    <span className={`status-badge ${appointment.status}`}>
                      {appointment.status === 'scheduled' ? 'Confirmed' : appointment.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="appointment-details">
                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <span className="detail-text">
                        {new Date(appointment.appointmentDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">⏰</span>
                      <span className="detail-text">{appointment.appointmentTime}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">💭</span>
                      <span className="detail-text">Visit for: {appointment.reason}</span>
                    </div>
                  </div>

                  <div className="appointment-actions">
                    <div className="action-group">
                      <button 
                        onClick={() => openModal('appointment-details', appointment)}
                        className="action-btn secondary"
                        title="View complete appointment details"
                      >
                        📋 View Details
                      </button>
                      <button 
                        onClick={() => startVideoCall(appointment)}
                        className="action-btn video-call"
                        title="Start a video consultation with your doctor"
                      >
                        📹 Video Call
                      </button>
                      <button 
                        onClick={() => startChat(appointment)}
                        className="action-btn chat"
                        title="Send a message to your doctor"
                      >
                        💬 Chat
                      </button>
                      <button 
                        onClick={() => handleAppointmentAction(appointment._id, 'cancel')}
                        className="action-btn cancel"
                        title="Cancel this appointment"
                      >
                        ❌ Cancel
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
          <h2>📋 Recent Medical Visits</h2>
          <p className="section-description">Review your completed consultations and follow up with your doctors</p>
          
          {completedAppointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No completed visits yet</h3>
              <p>Your completed consultations and medical visits will appear here for easy reference.</p>
            </div>
          ) : (
            <div className="appointments-list">
              {completedAppointments.slice(0, 3).map((appointment) => (
                <div key={appointment._id} className="appointment-card enhanced completed">
                  <div className="appointment-header">
                    <div className="doctor-info">
                      <div className="doctor-avatar">👨‍⚕️</div>
                      <div className="doctor-details">
                        <h4>Dr. {appointment.doctor.name}</h4>
                        <p className="specialization">{appointment.doctor.specialization}</p>
                        <p className="department">{appointment.department.name} Department</p>
                      </div>
                    </div>
                    <span className={`status-badge ${appointment.status}`}>
                      ✅ Completed
                    </span>
                  </div>
                  
                  <div className="appointment-details">
                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <span className="detail-text">
                        {new Date(appointment.appointmentDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">⏰</span>
                      <span className="detail-text">{appointment.appointmentTime}</span>
                    </div>
                    {appointment.prescription && appointment.prescription.medicines.length > 0 && (
                      <div className="detail-item">
                        <span className="detail-icon">💊</span>
                        <span className="detail-text">Prescription provided</span>
                      </div>
                    )}
                  </div>

                  <div className="appointment-actions">
                    <div className="action-group">
                      <button 
                        onClick={() => openModal('appointment-details', appointment)}
                        className="action-btn secondary"
                        title="View visit details and prescription"
                      >
                        📋 View Report
                      </button>
                      <button 
                        onClick={() => startVideoCall(appointment)}
                        className="action-btn video-call"
                        title="Schedule a follow-up video call"
                      >
                        📹 Follow-up Call
                      </button>
                      <button 
                        onClick={() => startChat(appointment)}
                        className="action-btn chat"
                        title="Ask questions about your visit"
                      >
                        💬 Ask Doctor
                      </button>
                    </div>
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

      {/* Incoming Call Notification */}
      {incomingCall && (
        <div className="incoming-call-notification">
          <div className="incoming-call-content">
            <h3>📞 Incoming Call</h3>
            <p>From: Dr. {incomingCall.callerName}</p>
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


    </div>
  );
};

export default PatientDashboard;
