import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SuperAdmin.css';

interface AnalyticsData {
  totalUsers: number;
  totalAdmins: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  totalDepartments: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  appointmentsThisMonth: number;
  recentActivity: ActivityItem[];
  popularDepartments: DepartmentStats[];
  userGrowth: GrowthData[];
  trends: {
    users: string;
    appointments: string;
  };
}

interface ActivityItem {
  action: string;
  user: string;
  timestamp: string;
  type: 'user' | 'appointment' | 'system';
}

interface DepartmentStats {
  name: string;
  appointmentCount: number;
  doctorCount: number;
}

interface GrowthData {
  date: string;
  users: number;
  appointments: number;
}

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalAdmins: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    totalDepartments: 0,
    appointmentsToday: 0,
    appointmentsThisWeek: 0,
    appointmentsThisMonth: 0,
    recentActivity: [],
    popularDepartments: [],
    userGrowth: [],
    trends: {
      users: '0',
      appointments: '0'
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch analytics, activity, and growth data in parallel
      const [analyticsRes, activityRes, growthRes, doctorsRes, departmentsRes, appointmentsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/analytics?period=${selectedPeriod}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/analytics/activity', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/analytics/growth?days=7', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/users?role=doctor', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/departments', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const analyticsData = analyticsRes.data;
      const recentActivity = activityRes.data;
      const userGrowth = growthRes.data;
      const doctors = doctorsRes.data;
      const departments = departmentsRes.data;
      const appointments = appointmentsRes.data;

      // Calculate popular departments
      const deptStats: { [key: string]: DepartmentStats } = {};
      departments.forEach((dept: any) => {
        const deptDoctors = doctors.filter((doc: any) => doc.department?._id === dept._id);
        const deptAppointments = appointments.filter((apt: any) => 
          deptDoctors.some((doc: any) => doc._id === apt.doctor)
        );
        
        deptStats[dept.name] = {
          name: dept.name,
          appointmentCount: deptAppointments.length,
          doctorCount: deptDoctors.length
        };
      });

      setAnalytics({
        ...analyticsData,
        recentActivity,
        popularDepartments: Object.values(deptStats).sort((a, b) => b.appointmentCount - a.appointmentCount),
        userGrowth
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading analytics...</div>;

  return (
    <div className="analytics">
      <div className="analytics-header">
        <h2>📊 System Analytics</h2>
        <div className="period-selector">
          <button 
            className={selectedPeriod === 'day' ? 'active' : ''}
            onClick={() => setSelectedPeriod('day')}
          >
            Today
          </button>
          <button 
            className={selectedPeriod === 'week' ? 'active' : ''}
            onClick={() => setSelectedPeriod('week')}
          >
            This Week
          </button>
          <button 
            className={selectedPeriod === 'month' ? 'active' : ''}
            onClick={() => setSelectedPeriod('month')}
          >
            This Month
          </button>
        </div>
      </div>

      <div className="analytics-overview">
        <div className="analytics-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>{analytics.totalUsers}</h3>
            <p>Total Users</p>
            <span className={`trend ${parseFloat(analytics.trends.users) >= 0 ? 'positive' : 'negative'}`}>
              {parseFloat(analytics.trends.users) >= 0 ? '↗' : '↘'} {Math.abs(parseFloat(analytics.trends.users))}% this {selectedPeriod}
            </span>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <h3>{analytics.totalAppointments}</h3>
            <p>Total Appointments</p>
            <span className={`trend ${parseFloat(analytics.trends.appointments) >= 0 ? 'positive' : 'negative'}`}>
              {parseFloat(analytics.trends.appointments) >= 0 ? '↗' : '↘'} {Math.abs(parseFloat(analytics.trends.appointments))}% this {selectedPeriod}
            </span>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">👨‍⚕️</div>
          <div className="card-content">
            <h3>{analytics.totalDoctors}</h3>
            <p>Active Doctors</p>
            <span className="trend neutral">→ No change</span>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">🏥</div>
          <div className="card-content">
            <h3>{analytics.totalDepartments}</h3>
            <p>Departments</p>
            <span className="trend positive">↗ +1 this month</span>
          </div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-section">
          <h3>Appointment Statistics</h3>
          <div className="appointment-stats">
            <div className="stat-item">
              <span className="stat-value">{analytics.appointmentsToday}</span>
              <span className="stat-label">Today</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{analytics.appointmentsThisWeek}</span>
              <span className="stat-label">This Week</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{analytics.appointmentsThisMonth}</span>
              <span className="stat-label">This Month</span>
            </div>
          </div>
        </div>

        <div className="chart-section">
          <h3>Popular Departments</h3>
          <div className="department-stats">
            {analytics.popularDepartments.slice(0, 5).map((dept, index) => (
              <div key={dept.name} className="dept-stat-item">
                <div className="dept-info">
                  <span className="dept-name">{dept.name}</span>
                  <span className="dept-details">
                    {dept.appointmentCount} appointments, {dept.doctorCount} doctors
                  </span>
                </div>
                <div className="dept-bar">
                  <div 
                    className="dept-fill" 
                    style={{ 
                      width: `${(dept.appointmentCount / analytics.popularDepartments[0]?.appointmentCount || 1) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="analytics-bottom">
        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className={`activity-icon ${activity.type}`}>
                  {activity.type === 'user' ? '👤' : 
                   activity.type === 'appointment' ? '📅' : '⚙️'}
                </div>
                <div className="activity-content">
                  <p>{activity.action}</p>
                  <span>{activity.user} • {new Date(activity.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="growth-chart">
          <h3>System Growth (Last 7 Days)</h3>
          <div className="growth-data">
            {analytics.userGrowth.map((data, index) => (
              <div key={index} className="growth-item">
                <span className="growth-date">{data.date}</span>
                <div className="growth-bars">
                  <div className="growth-bar users">
                    <div className="bar-fill" style={{ height: `${(data.users / Math.max(...analytics.userGrowth.map(g => g.users))) * 100}%` }}>
                      <span className="bar-value">{data.users}</span>
                    </div>
                  </div>
                  <div className="growth-bar appointments">
                    <div className="bar-fill" style={{ height: `${(data.appointments / Math.max(...analytics.userGrowth.map(g => g.appointments))) * 100}%` }}>
                      <span className="bar-value">{data.appointments}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span><span className="legend-color users"></span>Users</span>
            <span><span className="legend-color appointments"></span>Appointments</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
