const express = require('express');
const {
  getLeaves,
  getLeave,
  applyLeave,
  updateLeave,
  reviewLeave,
  cancelLeave,
  getLeaveBalance,
  deleteLeave
} = require('../controllers/leaveController');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Routes accessible to all employees
router.get('/', getLeaves);
router.get('/balance/:userId?', getLeaveBalance);
router.get('/:id', getLeave);
router.post('/', applyLeave);
router.put('/:id', updateLeave);
router.put('/:id/cancel', cancelLeave);

// Routes for managers, team leads, HR, and admins
router.put('/:id/review', authorize('admin', 'hr_manager', 'manager', 'team_lead', 'department_head', 'project_manager'), reviewLeave);
router.delete('/:id', authorize('admin', 'hr_manager'), deleteLeave);

module.exports = router;
