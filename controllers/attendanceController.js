const Attendance = require('../models/Attendance');

// @desc    Get attendance records
// @route   GET /api/attendance?userId=xxx&startDate=xxx&endDate=xxx
// @access  Private
exports.getAttendance = async (req, res) => {
  try {
    let { projectId, userId, startDate, endDate, status } = req.query;

    // If projectId is not provided, use user's activeProject
    if (!projectId && req.user.activeProject) {
      projectId = req.user.activeProject.toString();
    }

    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID is required. Please select a project first.' 
      });
    }

    let query = { projectId };

    // Regular employees can only see their own attendance
    if (req.user.role === 'employee' || req.user.role === 'intern' || req.user.role === 'contractor') {
      query.userId = req.user.id;
    } else if (userId) {
      query.userId = userId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (status) query.status = status;

    const attendance = await Attendance.find(query)
      .populate('userId', 'name email employeeId department designation')
      .populate('approvedBy', 'name')
      .sort('-date');

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Mark attendance (check-in)
// @route   POST /api/attendance/checkin
// @access  Private
exports.checkIn = async (req, res) => {
  try {
    const { projectId } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    let attendance = await Attendance.findOne({
      userId: req.user.id,
      date: today
    });

    if (attendance && attendance.checkIn) {
      return res.status(400).json({ 
        success: false, 
        error: 'Already checked in today' 
      });
    }

    if (!attendance) {
      attendance = await Attendance.create({
        userId: req.user.id,
        projectId: projectId || req.user.activeProject,
        date: today,
        checkIn: new Date(),
        status: 'present',
        location: req.body.location || 'office'
      });
    } else {
      attendance.checkIn = new Date();
      attendance.status = 'present';
      attendance.location = req.body.location || 'office';
      await attendance.save();
    }

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Mark attendance (check-out)
// @route   POST /api/attendance/checkout
// @access  Private
exports.checkOut = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      userId: req.user.id,
      date: today
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please check in first' 
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ 
        success: false, 
        error: 'Already checked out today' 
      });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get attendance summary
// @route   GET /api/attendance/summary?userId=xxx&month=xxx&year=xxx
// @access  Private
exports.getAttendanceSummary = async (req, res) => {
  try {
    let { userId, month, year, projectId } = req.query;

    // If projectId is not provided, use user's activeProject
    if (!projectId && req.user.activeProject) {
      projectId = req.user.activeProject.toString();
    }

    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID is required' 
      });
    }

    // Default to current month/year
    const targetMonth = month ? parseInt(month) : new Date().getMonth();
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0);

    // Regular employees can only see their own summary
    if (!userId || (req.user.role === 'employee' && userId !== req.user.id)) {
      userId = req.user.id;
    }

    const attendance = await Attendance.find({
      userId,
      projectId,
      date: { $gte: startDate, $lte: endDate }
    });

    const summary = {
      totalDays: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      halfDay: attendance.filter(a => a.status === 'half_day').length,
      late: attendance.filter(a => a.status === 'late').length,
      onLeave: attendance.filter(a => a.status === 'on_leave').length,
      totalWorkingHours: attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0)
    };

    res.status(200).json({
      success: true,
      data: {
        month: targetMonth + 1,
        year: targetYear,
        summary,
        records: attendance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update attendance
// @route   PUT /api/attendance/:id
// @access  Private (Manager/Admin/HR)
exports.updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!attendance) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete attendance
// @route   DELETE /api/attendance/:id
// @access  Private (Admin/HR)
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);

    if (!attendance) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
