const Student = require('../models/Student');
const Lead = require('../models/Lead');

// @desc    Get all students for a project
// @route   GET /api/students?projectId=xxx
// @access  Private
exports.getStudents = async (req, res) => {
  try {
    let { projectId, status, assignedTo, search } = req.query;

    // If projectId is not provided, use user's activeProject
    if (!projectId && req.user.activeProject) {
      projectId = req.user.activeProject.toString();
    }

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required. Please select a project first.' });
    }

    let query = { projectId };

    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .populate('assignedTo', 'name email')
      .populate('enrolledCourses.courseId', 'name category')
      .populate('parentLead', 'name email')
      .populate('createdBy', 'name')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('enrolledCourses.courseId', 'name category pricing')
      .populate('parentLead', 'name email')
      .populate('createdBy', 'name');

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new student
// @route   POST /api/students
// @access  Private
exports.createStudent = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;

    const student = await Student.create(req.body);

    // If created from lead, update lead status
    if (req.body.parentLead) {
      await Lead.findByIdAndUpdate(req.body.parentLead, {
        status: 'converted',
        convertedAt: Date.now(),
        convertedToStudent: student._id
      });
    }

    res.status(201).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    await student.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Enroll student in course
// @route   POST /api/students/:id/enroll
// @access  Private
exports.enrollInCourse = async (req, res) => {
  try {
    const { courseId, batchName, totalAmount, amountPaid, status } = req.body;

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Check if already enrolled
    const alreadyEnrolled = student.enrolledCourses.some(
      course => course.courseId.toString() === courseId
    );

    if (alreadyEnrolled) {
      return res.status(400).json({ success: false, error: 'Student already enrolled in this course' });
    }

    student.enrolledCourses.push({
      courseId,
      batchName,
      totalAmount,
      amountPaid: amountPaid || 0,
      status: status || 'enrolled',
      paymentStatus: amountPaid >= totalAmount ? 'completed' : amountPaid > 0 ? 'partial' : 'pending'
    });

    if (student.status === 'prospect') {
      student.status = 'enrolled';
    }

    await student.save();

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update course enrollment
// @route   PUT /api/students/:id/courses/:courseId
// @access  Private
exports.updateEnrollment = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const courseIndex = student.enrolledCourses.findIndex(
      course => course.courseId.toString() === req.params.courseId
    );

    if (courseIndex === -1) {
      return res.status(404).json({ success: false, error: 'Course enrollment not found' });
    }

    // Update enrollment fields
    Object.keys(req.body).forEach(key => {
      student.enrolledCourses[courseIndex][key] = req.body[key];
    });

    // Update payment status
    const enrollment = student.enrolledCourses[courseIndex];
    if (enrollment.amountPaid >= enrollment.totalAmount) {
      enrollment.paymentStatus = 'completed';
    } else if (enrollment.amountPaid > 0) {
      enrollment.paymentStatus = 'partial';
    }

    await student.save();

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
