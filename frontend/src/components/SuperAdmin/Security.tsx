import React, { useState, useEffect } from 'react';
import './SuperAdmin.css';

interface SecurityLog {
  id: string;
  timestamp: string;
  event: string;
  user: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecuritySettings {
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  enableTwoFactor: boolean;
  enableLoginNotifications: boolean;
  enableAuditLog: boolean;
  blockSuspiciousIPs: boolean;
}

const Security: React.FC = () => {
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [settings, setSettings] = useState<SecuritySettings>({
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    enableTwoFactor: false,
    enableLoginNotifications: true,
    enableAuditLog: true,
    blockSuspiciousIPs: true
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('logs');

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      // Mock security logs data
      const mockLogs: SecurityLog[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          event: 'Successful login',
          user: 'admin@hospital.com',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          severity: 'low'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          event: 'Failed login attempt',
          user: 'unknown@email.com',
          ipAddress: '203.45.67.89',
          userAgent: 'curl/7.68.0',
          severity: 'medium'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          event: 'Password changed',
          user: 'doctor@hospital.com',
          ipAddress: '192.168.1.105',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
          severity: 'low'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          event: 'Multiple failed login attempts',
          user: 'admin@hospital.com',
          ipAddress: '185.234.72.45',
          userAgent: 'Python-requests/2.25.1',
          severity: 'high'
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          event: 'Suspicious API access',
          user: 'system',
          ipAddress: '45.123.45.67',
          userAgent: 'Bot/1.0',
          severity: 'critical'
        }
      ];

      setSecurityLogs(mockLogs);
      
      // Load settings from localStorage or use defaults
      const savedSettings = localStorage.getItem('securitySettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (setting: keyof SecuritySettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const saveSecuritySettings = () => {
    localStorage.setItem('securitySettings', JSON.stringify(settings));
    alert('Security settings saved successfully!');
  };

  const exportSecurityLogs = () => {
    const csvContent = [
      'Timestamp,Event,User,IP Address,Severity',
      ...securityLogs.map(log => 
        `${log.timestamp},${log.event},${log.user},${log.ipAddress},${log.severity}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const clearSecurityLogs = () => {
    if (window.confirm('Are you sure you want to clear all security logs?')) {
      setSecurityLogs([]);
      alert('Security logs cleared successfully!');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  if (loading) return <div className="loading">Loading security data...</div>;

  return (
    <div className="security">
      <h2>🔒 Security Management</h2>

      <div className="security-tabs">
        <button 
          className={activeTab === 'logs' ? 'active' : ''}
          onClick={() => setActiveTab('logs')}
        >
          Security Logs
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          Security Settings
        </button>
        <button 
          className={activeTab === 'monitoring' ? 'active' : ''}
          onClick={() => setActiveTab('monitoring')}
        >
          Real-time Monitoring
        </button>
      </div>

      {activeTab === 'logs' && (
        <div className="security-logs-section">
          <div className="logs-header">
            <h3>Security Event Logs</h3>
            <div className="logs-actions">
              <button className="export-btn" onClick={exportSecurityLogs}>
                📥 Export Logs
              </button>
              <button className="clear-btn" onClick={clearSecurityLogs}>
                🗑️ Clear Logs
              </button>
            </div>
          </div>

          <div className="security-summary">
            <div className="summary-item">
              <span className="summary-icon">🟢</span>
              <span className="summary-count">{securityLogs.filter(log => log.severity === 'low').length}</span>
              <span className="summary-label">Low Risk</span>
            </div>
            <div className="summary-item">
              <span className="summary-icon">🟡</span>
              <span className="summary-count">{securityLogs.filter(log => log.severity === 'medium').length}</span>
              <span className="summary-label">Medium Risk</span>
            </div>
            <div className="summary-item">
              <span className="summary-icon">🟠</span>
              <span className="summary-count">{securityLogs.filter(log => log.severity === 'high').length}</span>
              <span className="summary-label">High Risk</span>
            </div>
            <div className="summary-item">
              <span className="summary-icon">🔴</span>
              <span className="summary-count">{securityLogs.filter(log => log.severity === 'critical').length}</span>
              <span className="summary-label">Critical</span>
            </div>
          </div>

          <div className="security-logs-table">
            <table>
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Timestamp</th>
                  <th>Event</th>
                  <th>User</th>
                  <th>IP Address</th>
                  <th>User Agent</th>
                </tr>
              </thead>
              <tbody>
                {securityLogs.map((log) => (
                  <tr key={log.id} className={`severity-${log.severity}`}>
                    <td>
                      <span className="severity-indicator">
                        {getSeverityIcon(log.severity)}
                      </span>
                    </td>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{log.event}</td>
                    <td>{log.user}</td>
                    <td>{log.ipAddress}</td>
                    <td className="user-agent">{log.userAgent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="security-settings-section">
          <h3>Security Configuration</h3>
          
          <div className="settings-groups">
            <div className="settings-group">
              <h4>Password Policy</h4>
              <div className="setting-item">
                <label>Minimum Password Length</label>
                <input
                  type="number"
                  min="6"
                  max="20"
                  value={settings.passwordMinLength}
                  onChange={(e) => handleSettingChange('passwordMinLength', parseInt(e.target.value))}
                />
              </div>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.passwordRequireSpecialChars}
                    onChange={(e) => handleSettingChange('passwordRequireSpecialChars', e.target.checked)}
                  />
                  Require Special Characters
                </label>
              </div>
            </div>

            <div className="settings-group">
              <h4>Session Management</h4>
              <div className="setting-item">
                <label>Session Timeout (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                />
              </div>
              <div className="setting-item">
                <label>Max Login Attempts</label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="settings-group">
              <h4>Advanced Security</h4>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.enableTwoFactor}
                    onChange={(e) => handleSettingChange('enableTwoFactor', e.target.checked)}
                  />
                  Enable Two-Factor Authentication
                </label>
              </div>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.enableLoginNotifications}
                    onChange={(e) => handleSettingChange('enableLoginNotifications', e.target.checked)}
                  />
                  Send Login Notifications
                </label>
              </div>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.enableAuditLog}
                    onChange={(e) => handleSettingChange('enableAuditLog', e.target.checked)}
                  />
                  Enable Audit Logging
                </label>
              </div>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.blockSuspiciousIPs}
                    onChange={(e) => handleSettingChange('blockSuspiciousIPs', e.target.checked)}
                  />
                  Block Suspicious IP Addresses
                </label>
              </div>
            </div>
          </div>

          <button className="save-settings-btn" onClick={saveSecuritySettings}>
            💾 Save Security Settings
          </button>
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div className="monitoring-section">
          <h3>Real-time Security Monitoring</h3>
          
          <div className="monitoring-cards">
            <div className="monitoring-card">
              <div className="card-header">
                <h4>Active Sessions</h4>
                <span className="status-indicator online">●</span>
              </div>
              <div className="card-content">
                <div className="metric-value">24</div>
                <div className="metric-label">Current active user sessions</div>
              </div>
            </div>

            <div className="monitoring-card">
              <div className="card-header">
                <h4>Failed Logins (1h)</h4>
                <span className="status-indicator warning">●</span>
              </div>
              <div className="card-content">
                <div className="metric-value">7</div>
                <div className="metric-label">Failed login attempts</div>
              </div>
            </div>

            <div className="monitoring-card">
              <div className="card-header">
                <h4>Blocked IPs</h4>
                <span className="status-indicator danger">●</span>
              </div>
              <div className="card-content">
                <div className="metric-value">3</div>
                <div className="metric-label">Currently blocked IP addresses</div>
              </div>
            </div>

            <div className="monitoring-card">
              <div className="card-header">
                <h4>System Health</h4>
                <span className="status-indicator online">●</span>
              </div>
              <div className="card-content">
                <div className="metric-value">98%</div>
                <div className="metric-label">Overall system security score</div>
              </div>
            </div>
          </div>

          <div className="threat-alerts">
            <h4>Recent Security Alerts</h4>
            <div className="alerts-list">
              <div className="alert-item high">
                <span className="alert-icon">⚠️</span>
                <div className="alert-content">
                  <strong>Multiple Failed Login Attempts</strong>
                  <p>IP 185.234.72.45 attempted to login 5 times in the last 10 minutes</p>
                  <span className="alert-time">2 minutes ago</span>
                </div>
                <button className="alert-action">Block IP</button>
              </div>
              
              <div className="alert-item medium">
                <span className="alert-icon">🚫</span>
                <div className="alert-content">
                  <strong>Suspicious API Access</strong>
                  <p>Unusual API request pattern detected from 45.123.45.67</p>
                  <span className="alert-time">15 minutes ago</span>
                </div>
                <button className="alert-action">Investigate</button>
              </div>
              
              <div className="alert-item low">
                <span className="alert-icon">📊</span>
                <div className="alert-content">
                  <strong>Security Scan Completed</strong>
                  <p>Daily security scan completed successfully. No threats detected.</p>
                  <span className="alert-time">1 hour ago</span>
                </div>
                <button className="alert-action">View Report</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Security;
