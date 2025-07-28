const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get system analytics
// @route   GET /api/superadmin/analytics
// @access  Private - SuperAdmin only
const getSystemAnalytics = async (req, res) => {
  try {
    // Get all users by role
    const [admins, doctors, patients, appointments, departments] = await Promise.all([
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'patient' }),
      Appointment.countDocuments(),
      Department.countDocuments()
    ]);

    // Get appointments for time periods
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [appointmentsToday, appointmentsThisWeek, appointmentsThisMonth] = await Promise.all([
      Appointment.countDocuments({
        appointmentDate: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999)
        }
      }),
      Appointment.countDocuments({
        appointmentDate: { $gte: startOfWeek }
      }),
      Appointment.countDocuments({
        appointmentDate: { $gte: startOfMonth }
      })
    ]);

    // Get department-wise statistics
    const departmentStats = await Department.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'department',
          as: 'doctors'
        }
      },
      {
        $project: {
          name: 1,
          doctorCount: { $size: '$doctors' },
          isActive: 1
        }
      }
    ]);

    res.json({
      totalUsers: admins + doctors + patients + 1, // +1 for superadmin
      totalAdmins: admins,
      totalDoctors: doctors,
      totalPatients: patients,
      totalAppointments: appointments,
      totalDepartments: departments,
      appointmentsToday,
      appointmentsThisWeek,
      appointmentsThisMonth,
      departmentStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get system health status
// @route   GET /api/superadmin/health
// @access  Private - SuperAdmin only
const getSystemHealth = async (req, res) => {
  try {
    // Mock system health data
    const health = {
      database: { status: 'healthy', responseTime: '< 100ms' },
      server: { status: 'healthy', uptime: '99.9%', load: 'moderate' },
      security: { status: 'secure', threatsBlocked: 0, lastScan: new Date() },
      backup: { status: 'completed', lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create system backup
// @route   POST /api/superadmin/backup
// @access  Private - SuperAdmin only
const createBackup = async (req, res) => {
  try {
    // In a real implementation, this would trigger actual backup process
    const backup = {
      id: Date.now().toString(),
      filename: `hospital_backup_${new Date().toISOString().replace(/[:.]/g, '_').split('T')[0]}.sql.gz`,
      timestamp: new Date(),
      size: Math.floor(Math.random() * 50 + 100) + ' MB',
      type: 'manual',
      status: 'completed',
      duration: Math.floor(Math.random() * 180 + 60) + 's'
    };

    res.json({ message: 'Backup created successfully', backup });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get security logs
// @route   GET /api/superadmin/security-logs
// @access  Private - SuperAdmin only
const getSecurityLogs = async (req, res) => {
  try {
    // Mock security logs
    const logs = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        event: 'User login',
        user: req.user.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'low'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        event: 'Failed login attempt',
        user: 'unknown@email.com',
        ipAddress: '192.168.1.100',
        userAgent: 'curl/7.68.0',
        severity: 'medium'
      }
    ];

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update system settings
// @route   PUT /api/superadmin/settings
// @access  Private - SuperAdmin only
const updateSystemSettings = async (req, res) => {
  try {
    // In a real implementation, this would update system configuration
    const settings = req.body;
    
    // Mock response
    res.json({ message: 'System settings updated successfully', settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

router.get('/analytics', protect, authorize('superadmin'), getSystemAnalytics);
router.get('/health', protect, authorize('superadmin'), getSystemHealth);
router.post('/backup', protect, authorize('superadmin'), createBackup);
router.get('/security-logs', protect, authorize('superadmin'), getSecurityLogs);
router.put('/settings', protect, authorize('superadmin'), updateSystemSettings);

module.exports = router;
