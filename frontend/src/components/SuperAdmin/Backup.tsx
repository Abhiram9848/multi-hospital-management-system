import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SuperAdmin.css';

interface BackupRecord {
  id: string;
  filename: string;
  timestamp: string;
  size: string;
  type: 'full' | 'incremental' | 'manual';
  status: 'completed' | 'failed' | 'in-progress';
  duration: string;
}

interface BackupSettings {
  autoBackupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupTime: string;
  retentionDays: number;
  includeUserData: boolean;
  includeAppointments: boolean;
  includeDepartments: boolean;
  includeSystemSettings: boolean;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

interface SystemStats {
  totalUsers: number;
  totalAppointments: number;
  totalDepartments: number;
  databaseSize: string;
  lastBackup: string;
}

const Backup: React.FC = () => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [settings, setSettings] = useState<BackupSettings>({
    autoBackupEnabled: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    retentionDays: 30,
    includeUserData: true,
    includeAppointments: true,
    includeDepartments: true,
    includeSystemSettings: true,
    compressionEnabled: true,
    encryptionEnabled: true
  });
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalAppointments: 0,
    totalDepartments: 0,
    databaseSize: '0 MB',
    lastBackup: 'Never'
  });
  const [loading, setLoading] = useState(true);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [activeTab, setActiveTab] = useState('backups');

  useEffect(() => {
    fetchBackupData();
    fetchSystemStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBackupData = async () => {
    try {
      // Mock backup records
      const mockBackups: BackupRecord[] = [
        {
          id: '1',
          filename: 'hospital_backup_2026_01_24_02_00.sql.gz',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          size: '125.4 MB',
          type: 'full',
          status: 'completed',
          duration: '3m 42s'
        },
        {
          id: '2',
          filename: 'hospital_backup_2026_01_23_02_00.sql.gz',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          size: '123.8 MB',
          type: 'full',
          status: 'completed',
          duration: '3m 38s'
        },
        {
          id: '3',
          filename: 'hospital_incremental_2026_01_22_14_30.sql.gz',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 58).toISOString(),
          size: '15.2 MB',
          type: 'incremental',
          status: 'completed',
          duration: '45s'
        },
        {
          id: '4',
          filename: 'hospital_manual_2026_01_22_10_15.sql.gz',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 62).toISOString(),
          size: '124.1 MB',
          type: 'manual',
          status: 'completed',
          duration: '4m 12s'
        },
        {
          id: '5',
          filename: 'hospital_backup_2026_01_21_02_00.sql.gz',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
          size: '122.7 MB',
          type: 'full',
          status: 'failed',
          duration: '2m 15s'
        }
      ];

      setBackups(mockBackups);

      // Load settings from localStorage
      const savedSettings = localStorage.getItem('backupSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error fetching backup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [usersRes, appointmentsRes, departmentsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/departments', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const lastSuccessfulBackup = backups.find(b => b.status === 'completed');

      setSystemStats({
        totalUsers: usersRes.data.length,
        totalAppointments: appointmentsRes.data.length,
        totalDepartments: departmentsRes.data.length,
        databaseSize: '125.4 MB', // Mock size
        lastBackup: lastSuccessfulBackup ? 
          new Date(lastSuccessfulBackup.timestamp).toLocaleString() : 'Never'
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const handleSettingChange = (setting: keyof BackupSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const saveBackupSettings = () => {
    localStorage.setItem('backupSettings', JSON.stringify(settings));
    alert('Backup settings saved successfully!');
  };

  const createManualBackup = async () => {
    setBackupInProgress(true);
    
    try {
      // Simulate backup creation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newBackup: BackupRecord = {
        id: Date.now().toString(),
        filename: `hospital_manual_${new Date().toISOString().replace(/[:.]/g, '_').split('T')[0]}_${new Date().toTimeString().slice(0,5).replace(':', '_')}.sql.gz`,
        timestamp: new Date().toISOString(),
        size: '124.8 MB',
        type: 'manual',
        status: 'completed',
        duration: '3m 45s'
      };
      
      setBackups(prev => [newBackup, ...prev]);
      alert('Manual backup created successfully!');
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Failed to create backup. Please try again.');
    } finally {
      setBackupInProgress(false);
    }
  };

  const downloadBackup = (backup: BackupRecord) => {
    // In a real app, this would download the actual backup file
    alert(`Downloading ${backup.filename}...`);
  };

  const deleteBackup = (backupId: string) => {
    if (window.confirm('Are you sure you want to delete this backup?')) {
      setBackups(prev => prev.filter(backup => backup.id !== backupId));
      alert('Backup deleted successfully!');
    }
  };

  const restoreFromBackup = (backup: BackupRecord) => {
    if (window.confirm(`Are you sure you want to restore from ${backup.filename}? This will overwrite current data.`)) {
      alert('Restore functionality would be implemented here. This is a demo.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'in-progress': return '⏳';
      default: return '⚪';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'full': return '📦';
      case 'incremental': return '📄';
      case 'manual': return '🔧';
      default: return '📁';
    }
  };

  if (loading) return <div className="loading">Loading backup data...</div>;

  return (
    <div className="backup">
      <h2>💾 Backup & Restore</h2>

      <div className="backup-tabs">
        <button 
          className={activeTab === 'backups' ? 'active' : ''}
          onClick={() => setActiveTab('backups')}
        >
          Backup History
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          Backup Settings
        </button>
        <button 
          className={activeTab === 'restore' ? 'active' : ''}
          onClick={() => setActiveTab('restore')}
        >
          Restore Data
        </button>
      </div>

      {activeTab === 'backups' && (
        <div className="backup-history-section">
          <div className="backup-overview">
            <div className="overview-card">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <h3>{systemStats.totalUsers}</h3>
                <p>Total Users</p>
              </div>
            </div>
            <div className="overview-card">
              <div className="card-icon">📅</div>
              <div className="card-content">
                <h3>{systemStats.totalAppointments}</h3>
                <p>Appointments</p>
              </div>
            </div>
            <div className="overview-card">
              <div className="card-icon">🏥</div>
              <div className="card-content">
                <h3>{systemStats.totalDepartments}</h3>
                <p>Departments</p>
              </div>
            </div>
            <div className="overview-card">
              <div className="card-icon">💽</div>
              <div className="card-content">
                <h3>{systemStats.databaseSize}</h3>
                <p>Database Size</p>
              </div>
            </div>
          </div>

          <div className="backup-actions">
            <button 
              className="create-backup-btn"
              onClick={createManualBackup}
              disabled={backupInProgress}
            >
              {backupInProgress ? '⏳ Creating Backup...' : '🚀 Create Manual Backup'}
            </button>
            <div className="last-backup-info">
              <span>Last Backup: {systemStats.lastBackup}</span>
            </div>
          </div>

          <div className="backup-list">
            <h3>Backup History</h3>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Filename</th>
                  <th>Date & Time</th>
                  <th>Size</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id} className={`status-${backup.status}`}>
                    <td>
                      <span className="backup-type">
                        {getTypeIcon(backup.type)} {backup.type}
                      </span>
                    </td>
                    <td className="filename">{backup.filename}</td>
                    <td>{new Date(backup.timestamp).toLocaleString()}</td>
                    <td>{backup.size}</td>
                    <td>{backup.duration}</td>
                    <td>
                      <span className={`status-badge ${backup.status}`}>
                        {getStatusIcon(backup.status)} {backup.status}
                      </span>
                    </td>
                    <td>
                      <div className="backup-actions">
                        {backup.status === 'completed' && (
                          <>
                            <button 
                              className="download-btn"
                              onClick={() => downloadBackup(backup)}
                            >
                              📥
                            </button>
                            <button 
                              className="restore-btn"
                              onClick={() => restoreFromBackup(backup)}
                            >
                              🔄
                            </button>
                          </>
                        )}
                        <button 
                          className="delete-btn"
                          onClick={() => deleteBackup(backup.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="backup-settings-section">
          <h3>Backup Configuration</h3>
          
          <div className="settings-groups">
            <div className="settings-group">
              <h4>Automated Backup</h4>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.autoBackupEnabled}
                    onChange={(e) => handleSettingChange('autoBackupEnabled', e.target.checked)}
                  />
                  Enable Automatic Backups
                </label>
              </div>
              <div className="setting-item">
                <label>Backup Frequency</label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                  disabled={!settings.autoBackupEnabled}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Backup Time</label>
                <input
                  type="time"
                  value={settings.backupTime}
                  onChange={(e) => handleSettingChange('backupTime', e.target.value)}
                  disabled={!settings.autoBackupEnabled}
                />
              </div>
              <div className="setting-item">
                <label>Retention Period (days)</label>
                <input
                  type="number"
                  min="7"
                  max="365"
                  value={settings.retentionDays}
                  onChange={(e) => handleSettingChange('retentionDays', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="settings-group">
              <h4>Backup Content</h4>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.includeUserData}
                    onChange={(e) => handleSettingChange('includeUserData', e.target.checked)}
                  />
                  Include User Data
                </label>
              </div>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.includeAppointments}
                    onChange={(e) => handleSettingChange('includeAppointments', e.target.checked)}
                  />
                  Include Appointments
                </label>
              </div>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.includeDepartments}
                    onChange={(e) => handleSettingChange('includeDepartments', e.target.checked)}
                  />
                  Include Departments
                </label>
              </div>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.includeSystemSettings}
                    onChange={(e) => handleSettingChange('includeSystemSettings', e.target.checked)}
                  />
                  Include System Settings
                </label>
              </div>
            </div>

            <div className="settings-group">
              <h4>Advanced Options</h4>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.compressionEnabled}
                    onChange={(e) => handleSettingChange('compressionEnabled', e.target.checked)}
                  />
                  Enable Compression
                </label>
              </div>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.encryptionEnabled}
                    onChange={(e) => handleSettingChange('encryptionEnabled', e.target.checked)}
                  />
                  Enable Encryption
                </label>
              </div>
            </div>
          </div>

          <button className="save-settings-btn" onClick={saveBackupSettings}>
            💾 Save Backup Settings
          </button>
        </div>
      )}

      {activeTab === 'restore' && (
        <div className="restore-section">
          <h3>Data Restore</h3>
          
          <div className="restore-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <h4>Important Warning</h4>
              <p>Restoring from a backup will overwrite all current data. This action cannot be undone. Please ensure you have a recent backup before proceeding.</p>
            </div>
          </div>

          <div className="restore-options">
            <div className="restore-option">
              <h4>📦 Full System Restore</h4>
              <p>Restore entire system from a complete backup file</p>
              <input type="file" accept=".sql,.gz,.zip" />
              <button className="restore-btn">Restore Full System</button>
            </div>

            <div className="restore-option">
              <h4>📄 Selective Restore</h4>
              <p>Restore specific data components</p>
              <div className="selective-options">
                <label><input type="checkbox" /> User Accounts</label>
                <label><input type="checkbox" /> Appointments</label>
                <label><input type="checkbox" /> Departments</label>
                <label><input type="checkbox" /> System Settings</label>
              </div>
              <button className="restore-btn">Restore Selected</button>
            </div>

            <div className="restore-option">
              <h4>🔄 Point-in-Time Recovery</h4>
              <p>Restore system to a specific date and time</p>
              <input type="datetime-local" />
              <button className="restore-btn">Start Recovery</button>
            </div>
          </div>

          <div className="restore-history">
            <h4>Recent Restore Operations</h4>
            <div className="restore-log">
              <p><strong>No restore operations performed recently.</strong></p>
              <p>All restore operations will be logged here for audit purposes.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Backup;
