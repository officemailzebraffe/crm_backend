const express = require('express');
const {
  getAttendance,
  checkIn,
  checkOut,
  getAttendanceSummary,
  updateAttendance,
  deleteAttendance
} = require('../controllers/attendanceController');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Routes accessible to all employees
router.get('/', getAttendance);
router.post('/checkin', checkIn);
router.post('/checkout', checkOut);
router.get('/summary', getAttendanceSummary);

// Routes for managers, team leads, HR, and admins
router.put('/:id', authorize('admin', 'hr_manager', 'manager', 'team_lead', 'department_head'), updateAttendance);
router.delete('/:id', authorize('admin', 'hr_manager'), deleteAttendance);

module.exports = router;
