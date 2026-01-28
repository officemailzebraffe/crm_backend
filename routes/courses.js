const express = require('express');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  addBatch,
  updateBatch
} = require('../controllers/courseController');

const router = express.Router();
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getCourses)
  .post(protect, createCourse);

router.route('/:id')
  .get(protect, getCourse)
  .put(protect, updateCourse)
  .delete(protect, deleteCourse);

router.post('/:id/batches', protect, addBatch);
router.put('/:id/batches/:batchId', protect, updateBatch);

module.exports = router;
