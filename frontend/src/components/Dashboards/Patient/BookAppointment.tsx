import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PatientModals.css';

interface Department {
  _id: string;
  name: string;
}

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  department: Department;
}

interface BookAppointmentProps {
  onClose: () => void;
  onAppointmentBooked: () => void;
}

const BookAppointment: React.FC<BookAppointmentProps> = ({ onClose, onAppointmentBooked }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetchDoctorsByDepartment(selectedDepartment);
    } else {
      setDoctors([]);
      setSelectedDoctor('');
    }
  }, [selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login again.');
        return;
      }

      console.log('Fetching departments with token:', token.substring(0, 20) + '...');
      const response = await axios.get('http://localhost:5000/api/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Departments fetched successfully:', response.data);
      setDepartments(response.data);
    } catch (error: any) {
      console.error('Error fetching departments:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. Insufficient permissions.');
      } else {
        setError(error.response?.data?.message || 'Failed to load departments');
      }
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const fetchDoctorsByDepartment = async (departmentId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login again.');
        return;
      }

      console.log('Fetching doctors for department:', departmentId);
      const response = await axios.get('http://localhost:5000/api/users/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('All doctors fetched:', response.data);
      
      const filteredDoctors = response.data.filter((doctor: Doctor) => 
        doctor.department && doctor.department._id === departmentId
      );
      console.log('Filtered doctors for department:', filteredDoctors);
      setDoctors(filteredDoctors);
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. Insufficient permissions.');
      } else {
        setError(error.response?.data?.message || 'Failed to load doctors');
      }
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/appointments', {
        doctor: selectedDoctor,
        department: selectedDepartment,
        appointmentDate,
        appointmentTime,
        reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onAppointmentBooked();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content book-appointment-modal">
        <div className="modal-header">
          <h2>📅 Book New Appointment</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="appointment-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="department">Department *</label>
            <select
              id="department"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              required
              disabled={departmentsLoading}
            >
              <option value="">
                {departmentsLoading ? 'Loading departments...' : 'Select Department'}
              </option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {departmentsLoading && (
              <div className="loading-indicator">
                <span>🔄</span> Loading departments...
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="doctor">Doctor *</label>
            <select
              id="doctor"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              required
              disabled={!selectedDepartment}
            >
              <option value="">Select Doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  Dr. {doctor.name} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Appointment Date *</label>
              <input
                type="date"
                id="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={getTomorrowDate()}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="time">Appointment Time *</label>
              <select
                id="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                required
              >
                <option value="">Select Time</option>
                {generateTimeSlots().map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reason">Reason for Visit *</label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe your symptoms or reason for the appointment..."
              rows={4}
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookAppointment;
