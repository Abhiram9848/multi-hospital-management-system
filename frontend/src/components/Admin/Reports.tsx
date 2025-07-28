import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

interface ReportData {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalDepartments: number;
  appointmentsThisMonth: number;
  appointmentsToday: number;
  completedAppointments: number;
  cancelledAppointments: number;
  departmentStats: {
    name: string;
    doctorCount: number;
    appointmentCount: number;
  }[];
  monthlyStats: {
    month: string;
    appointments: number;
    patients: number;
  }[];
  genderDistribution: {
    male: number;
    female: number;
    other: number;
  };
  bloodGroupDistribution: {
    [key: string]: number;
  };
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [
        patientsRes,
        doctorsRes,
        appointmentsRes,
        departmentsRes
      ] = await Promise.all([
        axios.get('http://localhost:5000/api/users?role=patient', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/users?role=doctor', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/departments', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const patients = patientsRes.data;
      const doctors = doctorsRes.data;
      const appointments = appointmentsRes.data;
      const departments = departmentsRes.data;

      // Calculate date-based statistics
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const appointmentsThisMonth = appointments.filter((apt: any) => 
        new Date(apt.appointmentDate) >= startOfMonth
      ).length;

      const appointmentsToday = appointments.filter((apt: any) => 
        new Date(apt.appointmentDate).toDateString() === today.toDateString()
      ).length;

      const completedAppointments = appointments.filter((apt: any) => apt.status === 'completed').length;
      const cancelledAppointments = appointments.filter((apt: any) => apt.status === 'cancelled').length;

      // Department statistics
      const departmentStats = departments.map((dept: any) => {
        const deptDoctors = doctors.filter((doc: any) => doc.department?._id === dept._id);
        const deptAppointments = appointments.filter((apt: any) => 
          deptDoctors.some((doc: any) => doc._id === apt.doctor || apt.doctor._id === doc._id)
        );
        
        return {
          name: dept.name,
          doctorCount: deptDoctors.length,
          appointmentCount: deptAppointments.length
        };
      });

      // Monthly statistics (last 6 months)
      const monthlyStats = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthAppointments = appointments.filter((apt: any) => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate >= monthStart && aptDate <= monthEnd;
        }).length;

        const monthPatients = patients.filter((patient: any) => {
          const regDate = new Date(patient.createdAt);
          return regDate >= monthStart && regDate <= monthEnd;
        }).length;

        monthlyStats.push({
          month: date.toLocaleDateString('en', { month: 'short', year: 'numeric' }),
          appointments: monthAppointments,
          patients: monthPatients
        });
      }

      // Gender distribution
      const genderDistribution = {
        male: patients.filter((p: any) => p.gender === 'male').length,
        female: patients.filter((p: any) => p.gender === 'female').length,
        other: patients.filter((p: any) => p.gender === 'other').length
      };

      // Blood group distribution
      const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const bloodGroupDistribution: {[key: string]: number} = {};
      bloodGroups.forEach(group => {
        bloodGroupDistribution[group] = patients.filter((p: any) => p.bloodGroup === group).length;
      });

      setReportData({
        totalPatients: patients.length,
        totalDoctors: doctors.length,
        totalAppointments: appointments.length,
        totalDepartments: departments.length,
        appointmentsThisMonth,
        appointmentsToday,
        completedAppointments,
        cancelledAppointments,
        departmentStats,
        monthlyStats,
        genderDistribution,
        bloodGroupDistribution
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format: 'csv' | 'pdf') => {
    if (!reportData) return;

    if (format === 'csv') {
      const csvData = [
        'Hospital Management System Report',
        `Generated on: ${new Date().toLocaleDateString()}`,
        '',
        'OVERVIEW STATISTICS',
        `Total Patients,${reportData.totalPatients}`,
        `Total Doctors,${reportData.totalDoctors}`,
        `Total Appointments,${reportData.totalAppointments}`,
        `Total Departments,${reportData.totalDepartments}`,
        `Appointments This Month,${reportData.appointmentsThisMonth}`,
        `Appointments Today,${reportData.appointmentsToday}`,
        `Completed Appointments,${reportData.completedAppointments}`,
        `Cancelled Appointments,${reportData.cancelledAppointments}`,
        '',
        'DEPARTMENT STATISTICS',
        'Department,Doctors,Appointments',
        ...reportData.departmentStats.map(dept => 
          `${dept.name},${dept.doctorCount},${dept.appointmentCount}`
        ),
        '',
        'GENDER DISTRIBUTION',
        `Male,${reportData.genderDistribution.male}`,
        `Female,${reportData.genderDistribution.female}`,
        `Other,${reportData.genderDistribution.other}`,
        '',
        'BLOOD GROUP DISTRIBUTION',
        ...Object.entries(reportData.bloodGroupDistribution).map(([group, count]) => 
          `${group},${count}`
        )
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hospital-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else if (format === 'pdf') {
      // For PDF export, we'd normally use a library like jsPDF
      alert('PDF export functionality would be implemented with a PDF library like jsPDF');
    }
  };

  if (loading) return <div className="loading">Loading reports...</div>;
  if (!reportData) return <div className="loading">No data available</div>;

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>📊 Reports & Analytics</h2>
        <div className="report-actions">
          <button 
            className="export-btn"
            onClick={() => exportReport('csv')}
          >
            📥 Export CSV
          </button>
          <button 
            className="export-btn"
            onClick={() => exportReport('pdf')}
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="date-range-filter">
        <label>
          From:
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
          />
        </label>
        <label>
          To:
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
          />
        </label>
      </div>

      {/* Report Navigation */}
      <div className="report-tabs">
        <button 
          className={selectedReport === 'overview' ? 'active' : ''}
          onClick={() => setSelectedReport('overview')}
        >
          Overview
        </button>
        <button 
          className={selectedReport === 'departments' ? 'active' : ''}
          onClick={() => setSelectedReport('departments')}
        >
          Departments
        </button>
        <button 
          className={selectedReport === 'patients' ? 'active' : ''}
          onClick={() => setSelectedReport('patients')}
        >
          Patients
        </button>
        <button 
          className={selectedReport === 'trends' ? 'active' : ''}
          onClick={() => setSelectedReport('trends')}
        >
          Trends
        </button>
      </div>

      {/* Overview Report */}
      {selectedReport === 'overview' && (
        <div className="report-section">
          <h3>System Overview</h3>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{reportData.totalPatients}</h3>
                <p>Total Patients</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👨‍⚕️</div>
              <div className="stat-info">
                <h3>{reportData.totalDoctors}</h3>
                <p>Total Doctors</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>{reportData.totalAppointments}</h3>
                <p>Total Appointments</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏥</div>
              <div className="stat-info">
                <h3>{reportData.totalDepartments}</h3>
                <p>Total Departments</p>
              </div>
            </div>
          </div>

          <div className="report-row">
            <div className="report-card">
              <h4>Appointment Statistics</h4>
              <div className="appointment-stats">
                <div className="stat-item">
                  <span className="stat-label">This Month:</span>
                  <span className="stat-value">{reportData.appointmentsThisMonth}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Today:</span>
                  <span className="stat-value">{reportData.appointmentsToday}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Completed:</span>
                  <span className="stat-value">{reportData.completedAppointments}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Cancelled:</span>
                  <span className="stat-value">{reportData.cancelledAppointments}</span>
                </div>
              </div>
            </div>

            <div className="report-card">
              <h4>Success Rate</h4>
              <div className="success-rate">
                <div className="rate-circle">
                  <span className="rate-percentage">
                    {reportData.totalAppointments > 0 
                      ? Math.round((reportData.completedAppointments / reportData.totalAppointments) * 100)
                      : 0}%
                  </span>
                  <span className="rate-label">Completion Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Report */}
      {selectedReport === 'departments' && (
        <div className="report-section">
          <h3>Department Performance</h3>
          
          <div className="department-report-grid">
            {reportData.departmentStats.map((dept, index) => (
              <div key={index} className="department-report-card">
                <h4>{dept.name}</h4>
                <div className="dept-metrics">
                  <div className="metric">
                    <span className="metric-value">{dept.doctorCount}</span>
                    <span className="metric-label">Doctors</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">{dept.appointmentCount}</span>
                    <span className="metric-label">Appointments</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">
                      {dept.doctorCount > 0 ? Math.round(dept.appointmentCount / dept.doctorCount) : 0}
                    </span>
                    <span className="metric-label">Avg per Doctor</span>
                  </div>
                </div>
                <div className="dept-performance-bar">
                  <div 
                    className="performance-fill" 
                    style={{ 
                      width: `${Math.min((dept.appointmentCount / Math.max(...reportData.departmentStats.map(d => d.appointmentCount))) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient Report */}
      {selectedReport === 'patients' && (
        <div className="report-section">
          <h3>Patient Demographics</h3>
          
          <div className="demographics-grid">
            <div className="demo-card">
              <h4>Gender Distribution</h4>
              <div className="gender-stats">
                <div className="gender-item">
                  <span className="gender-label">Male:</span>
                  <span className="gender-value">{reportData.genderDistribution.male}</span>
                  <span className="gender-percentage">
                    ({Math.round((reportData.genderDistribution.male / reportData.totalPatients) * 100)}%)
                  </span>
                </div>
                <div className="gender-item">
                  <span className="gender-label">Female:</span>
                  <span className="gender-value">{reportData.genderDistribution.female}</span>
                  <span className="gender-percentage">
                    ({Math.round((reportData.genderDistribution.female / reportData.totalPatients) * 100)}%)
                  </span>
                </div>
                <div className="gender-item">
                  <span className="gender-label">Other:</span>
                  <span className="gender-value">{reportData.genderDistribution.other}</span>
                  <span className="gender-percentage">
                    ({Math.round((reportData.genderDistribution.other / reportData.totalPatients) * 100)}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="demo-card">
              <h4>Blood Group Distribution</h4>
              <div className="blood-group-grid">
                {Object.entries(reportData.bloodGroupDistribution).map(([group, count]) => (
                  <div key={group} className="blood-group-item">
                    <span className="blood-group">{group}</span>
                    <span className="blood-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trends Report */}
      {selectedReport === 'trends' && (
        <div className="report-section">
          <h3>Growth Trends (Last 6 Months)</h3>
          
          <div className="trends-chart">
            <div className="chart-container">
              <div className="chart-bars">
                {reportData.monthlyStats.map((month, index) => (
                  <div key={index} className="month-data">
                    <div className="bars-group">
                      <div 
                        className="trend-bar appointments"
                        style={{ 
                          height: `${(month.appointments / Math.max(...reportData.monthlyStats.map(m => m.appointments))) * 100}%` 
                        }}
                        title={`${month.appointments} appointments`}
                      ></div>
                      <div 
                        className="trend-bar patients"
                        style={{ 
                          height: `${(month.patients / Math.max(...reportData.monthlyStats.map(m => m.patients))) * 100}%` 
                        }}
                        title={`${month.patients} new patients`}
                      ></div>
                    </div>
                    <span className="month-label">{month.month}</span>
                  </div>
                ))}
              </div>
              
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color appointments"></span>
                  <span>Appointments</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color patients"></span>
                  <span>New Patients</span>
                </div>
              </div>
            </div>
          </div>

          <div className="trends-summary">
            <div className="trend-card">
              <h4>Patient Growth</h4>
              <p>
                <strong>{reportData.monthlyStats[reportData.monthlyStats.length - 1]?.patients || 0}</strong> new patients this month
              </p>
            </div>
            <div className="trend-card">
              <h4>Appointment Volume</h4>
              <p>
                <strong>{reportData.monthlyStats[reportData.monthlyStats.length - 1]?.appointments || 0}</strong> appointments this month
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
