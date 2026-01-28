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
const { protect } = require('../middleware/auth');

router.get('/me', protect, getMyTasks);

router.route('/')
  .get(protect, getTasks)
  .post(protect, createTask);

router.route('/:id')
  .get(protect, getTask)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

module.exports = router;
