const express = require('express');
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  enrollInCourse,
  updateEnrollment
} = require('../controllers/studentController');

const router = express.Router();
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getStudents)
  .post(protect, createStudent);

router.route('/:id')
  .get(protect, getStudent)
  .put(protect, updateStudent)
  .delete(protect, deleteStudent);

router.post('/:id/enroll', protect, enrollInCourse);
router.put('/:id/courses/:courseId', protect, updateEnrollment);

module.exports = router;
