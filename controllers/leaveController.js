const Leave = require('../models/Leave');
const User = require('../models/User');

// @desc    Get leave applications
// @route   GET /api/leaves?userId=xxx&status=xxx
// @access  Private
exports.getLeaves = async (req, res) => {
  try {
    let { projectId, userId, status, startDate, endDate } = req.query;

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

    // Regular employees can only see their own leaves
    if (req.user.role === 'employee' || req.user.role === 'intern' || req.user.role === 'contractor') {
      query.userId = req.user.id;
    } else if (userId) {
      query.userId = userId;
    }

    if (status) query.status = status;
    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }

    const leaves = await Leave.find(query)
      .populate('userId', 'name email employeeId department designation')
      .populate('reviewedBy', 'name')
      .sort('-appliedOn');

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single leave
// @route   GET /api/leaves/:id
// @access  Private
exports.getLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('userId', 'name email employeeId department designation')
      .populate('reviewedBy', 'name');

    if (!leave) {
      return res.status(404).json({ success: false, error: 'Leave application not found' });
    }

    // Users can only see their own leaves unless they're managers/admins
    if (leave.userId._id.toString() !== req.user.id && 
        !['admin', 'hr_manager', 'manager', 'team_lead'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to view this leave' 
      });
    }

    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private
exports.applyLeave = async (req, res) => {
  try {
    req.body.userId = req.user.id;

    // If projectId is not provided, use user's activeProject
    if (!req.body.projectId && req.user.activeProject) {
      req.body.projectId = req.user.activeProject;
    }

    if (!req.body.projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID is required' 
      });
    }

    // Check for overlapping leaves
    const overlappingLeave = await Leave.findOne({
      userId: req.user.id,
      status: { $in: ['pending', 'approved'] },
      $or: [
        {
          startDate: { $lte: new Date(req.body.endDate) },
          endDate: { $gte: new Date(req.body.startDate) }
        }
      ]
    });

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        error: 'You already have a leave application for overlapping dates'
      });
    }

    const leave = await Leave.create(req.body);

    res.status(201).json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update leave (for editing pending leaves)
// @route   PUT /api/leaves/:id
// @access  Private
exports.updateLeave = async (req, res) => {
  try {
    let leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, error: 'Leave not found' });
    }

    // Only the applicant can edit their pending leave
    if (leave.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to update this leave' 
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: 'Can only edit pending leave applications' 
      });
    }

    leave = await Leave.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Approve/Reject leave
// @route   PUT /api/leaves/:id/review
// @access  Private (Manager/Admin/HR)
exports.reviewLeave = async (req, res) => {
  try {
    const { status, reviewComments } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Status must be approved or rejected' 
      });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, error: 'Leave not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: 'Leave already reviewed' 
      });
    }

    leave.status = status;
    leave.reviewedBy = req.user.id;
    leave.reviewedOn = new Date();
    leave.reviewComments = reviewComments;

    await leave.save();

    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Cancel leave
// @route   PUT /api/leaves/:id/cancel
// @access  Private
exports.cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, error: 'Leave not found' });
    }

    if (leave.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to cancel this leave' 
      });
    }

    if (leave.status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        error: 'Leave already cancelled' 
      });
    }

    leave.status = 'cancelled';
    await leave.save();

    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get leave balance
// @route   GET /api/leaves/balance/:userId
// @access  Private
exports.getLeaveBalance = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    // Check authorization
    if (userId !== req.user.id && 
        !['admin', 'hr_manager', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized' 
      });
    }

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);

    const leaves = await Leave.find({
      userId,
      status: 'approved',
      startDate: { $gte: yearStart, $lte: yearEnd }
    });

    // Calculate leave balance by type
    const leaveBalance = {
      casual: { total: 12, used: 0, available: 12 },
      sick: { total: 10, used: 0, available: 10 },
      earned: { total: 15, used: 0, available: 15 },
      unpaid: { total: 0, used: 0, available: 0 }
    };

    leaves.forEach(leave => {
      if (leaveBalance[leave.leaveType]) {
        leaveBalance[leave.leaveType].used += leave.numberOfDays;
        leaveBalance[leave.leaveType].available = 
          leaveBalance[leave.leaveType].total - leaveBalance[leave.leaveType].used;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        year: currentYear,
        balance: leaveBalance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete leave
// @route   DELETE /api/leaves/:id
// @access  Private (Admin/HR)
exports.deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, error: 'Leave not found' });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
