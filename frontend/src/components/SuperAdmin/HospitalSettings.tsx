import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SuperAdmin.css';

interface Settings {
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalEmail: string;
  emergencyContact: string;
  workingHours: {
    start: string;
    end: string;
  };
  appointmentSlotDuration: number;
  maxAppointmentsPerDay: number;
  enableNotifications: boolean;
  enableOnlinePayments: boolean;
}

interface Department {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  headOfDepartment?: {
    name: string;
  };
}

const HospitalSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    hospitalName: 'City General Hospital',
    hospitalAddress: '123 Healthcare Ave, Medical City, MC 12345',
    hospitalPhone: '+1-555-HOSPITAL',
    hospitalEmail: 'info@citygeneral.com',
    emergencyContact: '+1-555-EMERGENCY',
    workingHours: {
      start: '08:00',
      end: '18:00'
    },
    appointmentSlotDuration: 30,
    maxAppointmentsPerDay: 50,
    enableNotifications: true,
    enableOnlinePayments: false
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSettingsChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSettings(prev => {
        if (parent === 'workingHours') {
          return {
            ...prev,
            workingHours: {
              ...prev.workingHours,
              [child]: value
            }
          };
        }
        return prev;
      });
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSaveSettings = async () => {
    try {
      // In a real app, you'd save these to the backend
      localStorage.setItem('hospitalSettings', JSON.stringify(settings));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/departments', 
        newDepartment,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowAddDept(false);
      setNewDepartment({ name: '', description: '' });
      fetchDepartments();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error adding department');
    }
  };

  const handleToggleDepartment = async (deptId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/departments/${deptId}`,
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDepartments();
    } catch (error) {
      console.error('Error updating department status:', error);
    }
  };

  return (
    <div className="hospital-settings">
      <h2>🏥 Hospital Settings</h2>

      <div className="settings-container">
        <div className="settings-section">
          <h3>Hospital Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Hospital Name</label>
              <input
                type="text"
                value={settings.hospitalName}
                onChange={(e) => handleSettingsChange('hospitalName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={settings.hospitalPhone}
                onChange={(e) => handleSettingsChange('hospitalPhone', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={settings.hospitalEmail}
                onChange={(e) => handleSettingsChange('hospitalEmail', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Emergency Contact</label>
              <input
                type="tel"
                value={settings.emergencyContact}
                onChange={(e) => handleSettingsChange('emergencyContact', e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Hospital Address</label>
            <textarea
              value={settings.hospitalAddress}
              onChange={(e) => handleSettingsChange('hospitalAddress', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="settings-section">
          <h3>Operating Hours</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Start Time</label>
              <input
                type="time"
                value={settings.workingHours.start}
                onChange={(e) => handleSettingsChange('workingHours.start', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input
                type="time"
                value={settings.workingHours.end}
                onChange={(e) => handleSettingsChange('workingHours.end', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Appointment Settings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Slot Duration (minutes)</label>
              <input
                type="number"
                value={settings.appointmentSlotDuration}
                onChange={(e) => handleSettingsChange('appointmentSlotDuration', parseInt(e.target.value))}
                min="15"
                max="120"
              />
            </div>
            <div className="form-group">
              <label>Max Appointments/Day</label>
              <input
                type="number"
                value={settings.maxAppointmentsPerDay}
                onChange={(e) => handleSettingsChange('maxAppointmentsPerDay', parseInt(e.target.value))}
                min="10"
                max="200"
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>System Preferences</h3>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.enableNotifications}
                onChange={(e) => handleSettingsChange('enableNotifications', e.target.checked)}
              />
              Enable Email Notifications
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.enableOnlinePayments}
                onChange={(e) => handleSettingsChange('enableOnlinePayments', e.target.checked)}
              />
              Enable Online Payments
            </label>
          </div>
        </div>

        <button className="save-settings-btn" onClick={handleSaveSettings}>
          💾 Save All Settings
        </button>
      </div>

      <div className="departments-section">
        <div className="section-header">
          <h3>🏥 Department Management</h3>
          <button 
            className="add-btn"
            onClick={() => setShowAddDept(true)}
          >
            + Add Department
          </button>
        </div>

        {showAddDept && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Add New Department</h3>
              <form onSubmit={handleAddDepartment}>
                <input
                  type="text"
                  placeholder="Department Name"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                  required
                />
                <textarea
                  placeholder="Department Description"
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                  required
                />
                <div className="modal-actions">
                  <button type="submit" className="save-btn">Save Department</button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setShowAddDept(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="departments-grid">
          {departments.map((dept) => (
            <div key={dept._id} className="department-card">
              <div className="dept-header">
                <h4>{dept.name}</h4>
                <span className={`status-badge ${dept.isActive ? 'active' : 'inactive'}`}>
                  {dept.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p>{dept.description}</p>
              {dept.headOfDepartment && (
                <p className="dept-head">Head: {dept.headOfDepartment.name}</p>
              )}
              <button
                className={`toggle-btn ${dept.isActive ? 'deactivate' : 'activate'}`}
                onClick={() => handleToggleDepartment(dept._id, dept.isActive)}
              >
                {dept.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HospitalSettings;
