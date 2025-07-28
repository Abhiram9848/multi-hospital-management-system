import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SuperAdmin.css';
import './ModernManagement.css';

interface Admin {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

interface NewAdmin {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newAdmin, setNewAdmin] = useState<NewAdmin>({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users?role=admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/auth/register', 
        { ...newAdmin, role: 'admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowAddForm(false);
      setNewAdmin({ name: '', email: '', password: '', phone: '', address: '' });
      fetchAdmins();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error adding admin');
    }
  };

  const handleToggleActive = async (adminId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/users/${adminId}`,
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAdmins();
    } catch (error) {
      console.error('Error updating admin status:', error);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/users/${adminId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchAdmins();
      } catch (error) {
        console.error('Error deleting admin:', error);
      }
    }
  };

  if (loading) return <div className="loading">Loading admins...</div>;

  return (
    <div className="admin-management modern-management">
      <div className="management-header enhanced">
        <div className="header-content">
          <div className="header-info">
            <h2>👨‍💼 Admin Management</h2>
            <p>Manage system administrators and their access permissions</p>
          </div>
          <div className="header-actions">
            <button 
              className="refresh-btn"
              onClick={fetchAdmins}
              title="Refresh admin list"
            >
              🔄 Refresh
            </button>
            <button 
              className="add-btn modern"
              onClick={() => setShowAddForm(true)}
            >
              ➕ Add New Admin
            </button>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>➕ Add New Administrator</h3>
            <form onSubmit={handleAddAdmin}>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="👤 Full Name"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                  required
                />
                <input
                  type="email"
                  placeholder="✉️ Email Address"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  required
                />
                <input
                  type="password"
                  placeholder="🔒 Password (min. 6 characters)"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  required
                  minLength={6}
                />
                <input
                  type="tel"
                  placeholder="📞 Phone Number"
                  value={newAdmin.phone}
                  onChange={(e) => setNewAdmin({...newAdmin, phone: e.target.value})}
                  required
                />
              </div>
              <textarea
                placeholder="📍 Address"
                value={newAdmin.address}
                onChange={(e) => setNewAdmin({...newAdmin, address: e.target.value})}
                required
              />
              <div className="modal-actions">
                <button type="submit" className="save-btn">💾 Save Administrator</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowAddForm(false)}
                >
                  ❌ Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="management-stats enhanced-stats">
        <div className="stat-card mini total">
          <div className="stat-icon">👥</div>
          <div className="stat-details">
            <span className="stat-number">{admins.length}</span>
            <span className="stat-label">Total Admins</span>
          </div>
        </div>
        <div className="stat-card mini active">
          <div className="stat-icon">✅</div>
          <div className="stat-details">
            <span className="stat-number">{admins.filter(admin => admin.isActive).length}</span>
            <span className="stat-label">Active Admins</span>
          </div>
        </div>
        <div className="stat-card mini inactive">
          <div className="stat-icon">⏸️</div>
          <div className="stat-details">
            <span className="stat-number">{admins.filter(admin => !admin.isActive).length}</span>
            <span className="stat-label">Inactive Admins</span>
          </div>
        </div>
        <div className="stat-card mini recent">
          <div className="stat-icon">📅</div>
          <div className="stat-details">
            <span className="stat-number">
              {admins.filter(admin => {
                const createdDate = new Date(admin.createdAt);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return createdDate > thirtyDaysAgo;
              }).length}
            </span>
            <span className="stat-label">Added This Month</span>
          </div>
        </div>
      </div>

      <div className="data-table enhanced">
        <div className="table-header enhanced">
          <h3>📋 System Administrators ({admins.length})</h3>
        </div>
        <div className="table-content">
          {admins.length === 0 ? (
            <div className="empty-state enhanced">
              <div className="empty-icon">👨‍💼</div>
              <h3>No administrators found</h3>
              <p>Start by adding your first system administrator</p>
            </div>
          ) : (
            <table className="admin-table enhanced">
              <thead>
                <tr>
                  <th>Administrator</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                          width: '2.5rem', 
                          height: '2.5rem', 
                          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '1rem'
                        }}>
                          👨‍💼
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{admin.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{admin.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                          📞 {admin.phone || 'Not provided'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          📍 {admin.address || 'Not provided'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge enhanced ${admin.isActive ? 'active' : 'inactive'}`}>
                        {admin.isActive ? '✅ Active' : '⏸️ Inactive'}
                      </span>
                    </td>
                    <td>
                      {new Date(admin.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td>
                      <div className="action-buttons enhanced">
                        <button
                          className="action-btn enhanced toggle"
                          onClick={() => handleToggleActive(admin._id, admin.isActive)}
                          title={admin.isActive ? 'Deactivate admin' : 'Activate admin'}
                        >
                          {admin.isActive ? '⏸️' : '▶️'}
                        </button>
                        <button
                          className="action-btn enhanced edit"
                          title="Edit admin details"
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn enhanced delete"
                          onClick={() => handleDeleteAdmin(admin._id)}
                          title="Delete admin account"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;
