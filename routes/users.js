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

// Get users - allow all authenticated users (for dropdowns)
router.get('/', protect, getUsers);

// All other routes require admin role
router.use(protect);
router.use(authorize('admin'));

router.post('/', createEmployee);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
