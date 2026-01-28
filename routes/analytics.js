const express = require('express');
const {
  getDashboardAnalytics,
  getLeadAnalytics,
  getStudentAnalytics,
  getRevenueAnalytics
} = require('../controllers/analyticsController');

const router = express.Router();
const { protect } = require('../middleware/auth');

router.get('/dashboard', protect, getDashboardAnalytics);
router.get('/leads', protect, getLeadAnalytics);
router.get('/students', protect, getStudentAnalytics);
router.get('/revenue', protect, getRevenueAnalytics);

module.exports = router;
