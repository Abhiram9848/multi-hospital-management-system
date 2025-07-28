import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

interface Appointment {
  _id: string;
  patient: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
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
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  fee: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
}

interface AppointmentStats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  today: number;
  thisWeek: number;
}

const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState<AppointmentStats>({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    today: 0,
    thisWeek: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    date: '',
    doctor: '',
    searchTerm: ''
  });

  useEffect(() => {
    fetchAppointments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    applyFilters();
  }, [appointments, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (appointmentsData: Appointment[]) => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    
    const stats = {
      total: appointmentsData.length,
      scheduled: appointmentsData.filter(apt => apt.status === 'scheduled').length,
      completed: appointmentsData.filter(apt => apt.status === 'completed').length,
      cancelled: appointmentsData.filter(apt => apt.status === 'cancelled').length,
      today: appointmentsData.filter(apt => 
        new Date(apt.appointmentDate).toDateString() === new Date().toDateString()
      ).length,
      thisWeek: appointmentsData.filter(apt => 
        new Date(apt.appointmentDate) >= startOfWeek
      ).length
    };
    
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...appointments];

    if (filters.status) {
      filtered = filtered.filter(apt => apt.status === filters.status);
    }

    if (filters.date) {
      filtered = filtered.filter(apt => 
        new Date(apt.appointmentDate).toDateString() === new Date(filters.date).toDateString()
      );
    }

    if (filters.doctor) {
      filtered = filtered.filter(apt => apt.doctor._id === filters.doctor);
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.patient.name.toLowerCase().includes(searchLower) ||
        apt.doctor.name.toLowerCase().includes(searchLower) ||
        apt.reason.toLowerCase().includes(searchLower)
      );
    }

    setFilteredAppointments(filtered);
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string, notes?: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/appointments/${appointmentId}`,
        { status: newStatus, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAppointments();
      alert('Appointment status updated successfully!');
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Error updating appointment status');
    }
  };

  const updatePaymentStatus = async (appointmentId: string, paymentStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/appointments/${appointmentId}`,
        { paymentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAppointments();
      alert('Payment status updated successfully!');
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Error updating payment status');
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    if (window.confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/appointments/${appointmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchAppointments();
        alert('Appointment deleted successfully!');
      } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('Error deleting appointment');
      }
    }
  };

  const exportAppointments = () => {
    const csvContent = [
      'Date,Time,Patient,Doctor,Department,Status,Payment Status,Fee',
      ...filteredAppointments.map(apt => 
        `${new Date(apt.appointmentDate).toLocaleDateString()},${apt.appointmentTime},${apt.patient.name},Dr. ${apt.doctor.name},${apt.department.name},${apt.status},${apt.paymentStatus},$${apt.fee}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#007bff';
      case 'completed': return '#28a745';
      case 'cancelled': return '#dc3545';
      case 'rescheduled': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#28a745';
      case 'pending': return '#ffc107';
      case 'refunded': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) return <div className="loading">Loading appointments...</div>;

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>📅 Appointment Management</h2>
        <button 
          className="export-btn"
          onClick={exportAppointments}
        >
          📥 Export Appointments
        </button>
      </div>

      {/* Statistics */}
      <div className="management-stats">
        <div className="stat-item">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Total Appointments</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.scheduled}</span>
          <span className="stat-label">Scheduled</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.completed}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.cancelled}</span>
          <span className="stat-label">Cancelled</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.today}</span>
          <span className="stat-label">Today</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.thisWeek}</span>
          <span className="stat-label">This Week</span>
        </div>
      </div>

      {/* Filters */}
      <div className="appointment-filters">
        <div className="filter-row">
          <input
            type="text"
            placeholder="Search by patient, doctor, or reason..."
            value={filters.searchTerm}
            onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
            className="search-input"
          />
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduled">Rescheduled</option>
          </select>

          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({...filters, date: e.target.value})}
          />

          <button 
            className="clear-filters-btn"
            onClick={() => setFilters({ status: '', date: '', doctor: '', searchTerm: '' })}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Appointment Details Modal */}
      {showDetails && selectedAppointment && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="appointment-details-header">
              <h3>Appointment Details</h3>
              <button 
                className="close-btn"
                onClick={() => setShowDetails(false)}
              >
                ×
              </button>
            </div>
            
            <div className="appointment-details-content">
              <div className="details-grid">
                <div className="detail-section">
                  <h4>Patient Information</h4>
                  <p><strong>Name:</strong> {selectedAppointment.patient.name}</p>
                  <p><strong>Email:</strong> {selectedAppointment.patient.email}</p>
                  <p><strong>Phone:</strong> {selectedAppointment.patient.phone}</p>
                </div>

                <div className="detail-section">
                  <h4>Doctor Information</h4>
                  <p><strong>Name:</strong> Dr. {selectedAppointment.doctor.name}</p>
                  <p><strong>Specialization:</strong> {selectedAppointment.doctor.specialization}</p>
                  <p><strong>Department:</strong> {selectedAppointment.department.name}</p>
                </div>

                <div className="detail-section">
                  <h4>Appointment Details</h4>
                  <p><strong>Date:</strong> {new Date(selectedAppointment.appointmentDate).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {selectedAppointment.appointmentTime}</p>
                  <p><strong>Reason:</strong> {selectedAppointment.reason}</p>
                  <p><strong>Fee:</strong> ${selectedAppointment.fee}</p>
                </div>

                <div className="detail-section">
                  <h4>Status Information</h4>
                  <p>
                    <strong>Status:</strong> 
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(selectedAppointment.status) }}
                    >
                      {selectedAppointment.status.toUpperCase()}
                    </span>
                  </p>
                  <p>
                    <strong>Payment:</strong> 
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getPaymentStatusColor(selectedAppointment.paymentStatus) }}
                    >
                      {selectedAppointment.paymentStatus.toUpperCase()}
                    </span>
                  </p>
                  {selectedAppointment.notes && (
                    <p><strong>Notes:</strong> {selectedAppointment.notes}</p>
                  )}
                </div>
              </div>

              <div className="appointment-actions">
                <div className="action-group">
                  <h4>Update Status</h4>
                  <div className="status-buttons">
                    <button 
                      className="status-btn scheduled"
                      onClick={() => updateAppointmentStatus(selectedAppointment._id, 'scheduled')}
                    >
                      Schedule
                    </button>
                    <button 
                      className="status-btn completed"
                      onClick={() => updateAppointmentStatus(selectedAppointment._id, 'completed')}
                    >
                      Complete
                    </button>
                    <button 
                      className="status-btn cancelled"
                      onClick={() => updateAppointmentStatus(selectedAppointment._id, 'cancelled')}
                    >
                      Cancel
                    </button>
                    <button 
                      className="status-btn rescheduled"
                      onClick={() => updateAppointmentStatus(selectedAppointment._id, 'rescheduled')}
                    >
                      Reschedule
                    </button>
                  </div>
                </div>

                <div className="action-group">
                  <h4>Update Payment</h4>
                  <div className="payment-buttons">
                    <button 
                      className="payment-btn pending"
                      onClick={() => updatePaymentStatus(selectedAppointment._id, 'pending')}
                    >
                      Pending
                    </button>
                    <button 
                      className="payment-btn paid"
                      onClick={() => updatePaymentStatus(selectedAppointment._id, 'paid')}
                    >
                      Paid
                    </button>
                    <button 
                      className="payment-btn refunded"
                      onClick={() => updatePaymentStatus(selectedAppointment._id, 'refunded')}
                    >
                      Refunded
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointments Table */}
      <div className="appointments-table">
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Department</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Fee</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.map((appointment) => (
              <tr key={appointment._id}>
                <td>
                  <div className="date-time">
                    <div>{new Date(appointment.appointmentDate).toLocaleDateString()}</div>
                    <small>{appointment.appointmentTime}</small>
                  </div>
                </td>
                <td>
                  <div className="patient-info">
                    <strong>{appointment.patient.name}</strong>
                    <small>{appointment.patient.phone}</small>
                  </div>
                </td>
                <td>
                  <div className="doctor-info">
                    <strong>Dr. {appointment.doctor.name}</strong>
                    <small>{appointment.doctor.specialization}</small>
                  </div>
                </td>
                <td>{appointment.department.name}</td>
                <td className="reason-cell">
                  {appointment.reason.length > 30 
                    ? `${appointment.reason.substring(0, 30)}...`
                    : appointment.reason
                  }
                </td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(appointment.status) }}
                  >
                    {appointment.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getPaymentStatusColor(appointment.paymentStatus) }}
                  >
                    {appointment.paymentStatus.toUpperCase()}
                  </span>
                </td>
                <td>${appointment.fee}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="view-btn"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowDetails(true);
                      }}
                    >
                      View
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => deleteAppointment(appointment._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAppointments.length === 0 && (
          <div className="no-results">
            <p>No appointments found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentManagement;
