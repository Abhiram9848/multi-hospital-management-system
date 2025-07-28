const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAnalytics,
  getRecentActivity,
  getGrowthData
} = require('../controllers/analyticsController');

// Routes
router.get('/', protect, authorize('superadmin', 'admin'), getAnalytics);
router.get('/activity', protect, authorize('superadmin', 'admin'), getRecentActivity);
router.get('/growth', protect, authorize('superadmin', 'admin'), getGrowthData);

module.exports = router;
