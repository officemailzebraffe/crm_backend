const express = require('express');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getMyTasks
} = require('../controllers/taskController');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

router.get('/me', protect, getMyTasks);

router.route('/')
  .get(protect, getTasks)
  .post(protect, authorize('admin', 'manager'), createTask);

router.route('/:id')
  .get(protect, getTask)
  .put(protect, authorize('admin', 'manager'), updateTask)
  .delete(protect, authorize('admin', 'manager'), deleteTask);

module.exports = router;
