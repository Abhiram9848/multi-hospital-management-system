const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Department = require('../models/Department');

// @desc    Get analytics data
// @route   GET /api/analytics
// @access  Private (Superadmin, Admin)
const getAnalytics = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(thisMonthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    // Get current counts
    const [totalUsers, totalDoctors, totalPatients, totalAdmins, totalAppointments, totalDepartments] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'admin' }),
      Appointment.countDocuments(),
      Department.countDocuments()
    ]);

    // Get previous period counts for trend calculation
    const [prevUsers, prevAppointments] = await Promise.all([
      User.countDocuments({ 
        createdAt: { 
          $lt: period === 'month' ? thisMonthStart : thisWeekStart 
        } 
      }),
      Appointment.countDocuments({ 
        createdAt: { 
          $lt: period === 'month' ? thisMonthStart : thisWeekStart 
        } 
      })
    ]);

    // Calculate trends
    const userTrend = prevUsers > 0 ? ((totalUsers - prevUsers) / prevUsers * 100).toFixed(1) : 0;
    const appointmentTrend = prevAppointments > 0 ? ((totalAppointments - prevAppointments) / prevAppointments * 100).toFixed(1) : 0;

    // Get appointment statistics
    const [appointmentsToday, appointmentsThisWeek, appointmentsThisMonth] = await Promise.all([
      Appointment.countDocuments({
        appointmentDate: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }),
      Appointment.countDocuments({
        appointmentDate: { $gte: thisWeekStart }
      }),
      Appointment.countDocuments({
        appointmentDate: { $gte: thisMonthStart }
      })
    ]);

    res.json({
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAdmins,
      totalAppointments,
      totalDepartments,
      appointmentsToday,
      appointmentsThisWeek,
      appointmentsThisMonth,
      trends: {
        users: userTrend,
        appointments: appointmentTrend
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recent activity
// @route   GET /api/analytics/activity
// @access  Private (Superadmin, Admin)
const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent users (last 24 hours)
    const recentUsers = await User.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: -1 }).limit(5).select('name role createdAt');

    // Get recent appointments (last 24 hours)
    const recentAppointments = await Appointment.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: -1 }).limit(5)
      .populate('patient', 'name')
      .populate('doctor', 'name');

    // Combine and format activities
    const activities = [];

    recentUsers.forEach(user => {
      activities.push({
        action: `New ${user.role} registered`,
        user: user.name,
        timestamp: user.createdAt,
        type: 'user'
      });
    });

    recentAppointments.forEach(appointment => {
      activities.push({
        action: 'Appointment scheduled',
        user: appointment.doctor?.name || 'Doctor',
        timestamp: appointment.createdAt,
        type: 'appointment'
      });
    });

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(activities.slice(0, limit));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get growth data
// @route   GET /api/analytics/growth
// @access  Private (Superadmin, Admin)
const getGrowthData = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const growthData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [userCount, appointmentCount] = await Promise.all([
        User.countDocuments({
          createdAt: { $lt: nextDate }
        }),
        Appointment.countDocuments({
          createdAt: { $lt: nextDate }
        })
      ]);

      growthData.push({
        date: date.toLocaleDateString(),
        users: userCount,
        appointments: appointmentCount
      });
    }

    res.json(growthData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAnalytics,
  getRecentActivity,
  getGrowthData
};
