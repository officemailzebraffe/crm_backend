const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  createEmployee
} = require('../controllers/userController');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// All routes require admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getUsers)
  .post(createEmployee);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
