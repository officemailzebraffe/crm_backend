const Lead = require('../models/Lead');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Task = require('../models/Task');
const Interaction = require('../models/Interaction');
const mongoose = require('mongoose');

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard?projectId=xxx
// @access  Private
exports.getDashboardAnalytics = async (req, res) => {
  try {
    let { projectId } = req.query;

    // If projectId is not provided, use user's activeProject
    if (!projectId && req.user.activeProject) {
      projectId = req.user.activeProject.toString();
    }

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required. Please select a project first.' });
    }

    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    // Lead statistics
    const totalLeads = await Lead.countDocuments({ projectId: projectObjectId });
    const leadsByStatus = await Lead.aggregate([
      { $match: { projectId: projectObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const convertedLeads = await Lead.countDocuments({ 
      projectId: projectObjectId, 
      status: 'converted' 
    });

    // Student statistics
    const totalStudents = await Student.countDocuments({ projectId: projectObjectId });
    const studentsByStatus = await Student.aggregate([
      { $match: { projectId: projectObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Course statistics
    const totalCourses = await Course.countDocuments({ projectId: projectObjectId, isActive: true });
    const totalEnrollments = await Student.aggregate([
      { $match: { projectId: projectObjectId } },
      { $unwind: { path: '$enrolledCourses', preserveNullAndEmptyArrays: true } },
      { $match: { enrolledCourses: { $ne: null } } },
      { $count: 'total' }
    ]);

    // Revenue statistics
    const revenueData = await Student.aggregate([
      { $match: { projectId: projectObjectId } },
      { $unwind: { path: '$enrolledCourses', preserveNullAndEmptyArrays: true } },
      { $match: { enrolledCourses: { $ne: null } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ['$enrolledCourses.amountPaid', 0] } },
          expectedRevenue: { $sum: { $ifNull: ['$enrolledCourses.totalAmount', 0] } }
        }
      }
    ]);

    // Task statistics
    const taskStats = await Task.aggregate([
      { $match: { projectId: projectObjectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const overdueTasks = await Task.countDocuments({
      projectId: projectObjectId,
      status: { $ne: 'completed' },
      dueDate: { $lt: new Date() }
    });

    // Recent interactions
    const recentInteractions = await Interaction.find({ projectId: projectObjectId })
      .populate('performedBy', 'name')
      .populate('relatedId', 'name')
      .sort('-createdAt')
      .limit(10);

    // Conversion rate
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        leads: {
          total: totalLeads,
          converted: convertedLeads,
          conversionRate: parseFloat(conversionRate),
          byStatus: leadsByStatus
        },
        students: {
          total: totalStudents,
          byStatus: studentsByStatus
        },
        courses: {
          total: totalCourses,
          totalEnrollments: totalEnrollments[0]?.total || 0
        },
        revenue: {
          collected: revenueData[0]?.totalRevenue || 0,
          expected: revenueData[0]?.expectedRevenue || 0,
          pending: (revenueData[0]?.expectedRevenue || 0) - (revenueData[0]?.totalRevenue || 0)
        },
        tasks: {
          byStatus: taskStats,
          overdue: overdueTasks
        },
        recentInteractions
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get lead analytics
// @route   GET /api/analytics/leads?projectId=xxx
// @access  Private
exports.getLeadAnalytics = async (req, res) => {
  try {
    let { projectId, startDate, endDate } = req.query;

    // If projectId is not provided, use user's activeProject
    if (!projectId && req.user.activeProject) {
      projectId = req.user.activeProject.toString();
    }

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required. Please select a project first.' });
    }

    const projectObjectId = new mongoose.Types.ObjectId(projectId);
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = { projectId: projectObjectId };
    if (Object.keys(dateFilter).length > 0) {
      matchStage.createdAt = dateFilter;
    }

    // Leads by source
    const bySource = await Lead.aggregate([
      { $match: matchStage },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);

    // Leads by score range
    const byScoreRange = await Lead.aggregate([
      { $match: matchStage },
      {
        $bucket: {
          groupBy: '$score',
          boundaries: [0, 20, 40, 60, 80, 100],
          default: 'Other',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    // Leads trend (last 30 days)
    const leadsTrend = await Lead.aggregate([
      {
        $match: {
          projectId: projectObjectId,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        bySource,
        byScoreRange,
        leadsTrend
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get student analytics
// @route   GET /api/analytics/students?projectId=xxx
// @access  Private
exports.getStudentAnalytics = async (req, res) => {
  try {
    let { projectId } = req.query;

    // If projectId is not provided, use user's activeProject
    if (!projectId && req.user.activeProject) {
      projectId = req.user.activeProject.toString();
    }

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required. Please select a project first.' });
    }

    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    // Students by course
    const byCourse = await Student.aggregate([
      { $match: { projectId: projectObjectId } },
      { $unwind: { path: '$enrolledCourses', preserveNullAndEmptyArrays: true } },
      { $match: { enrolledCourses: { $ne: null } } },
      {
        $group: {
          _id: '$enrolledCourses.courseId',
          count: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ['$enrolledCourses.amountPaid', 0] } }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          courseName: '$course.name',
          count: 1,
          totalRevenue: 1
        }
      }
    ]);

    // Enrollment trend
    const enrollmentTrend = await Student.aggregate([
      {
        $match: {
          projectId: projectObjectId,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        byCourse,
        enrollmentTrend
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get revenue analytics
// @route   GET /api/analytics/revenue?projectId=xxx
// @access  Private
exports.getRevenueAnalytics = async (req, res) => {
  try {
    let { projectId, startDate, endDate } = req.query;

    // If projectId is not provided, use user's activeProject
    if (!projectId && req.user.activeProject) {
      projectId = req.user.activeProject.toString();
    }

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required. Please select a project first.' });
    }

    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    // Revenue by course
    const byCourse = await Student.aggregate([
      { $match: { projectId: projectObjectId } },
      { $unwind: { path: '$enrolledCourses', preserveNullAndEmptyArrays: true } },
      { $match: { enrolledCourses: { $ne: null } } },
      {
        $group: {
          _id: '$enrolledCourses.courseId',
          totalCollected: { $sum: { $ifNull: ['$enrolledCourses.amountPaid', 0] } },
          totalExpected: { $sum: { $ifNull: ['$enrolledCourses.totalAmount', 0] } },
          enrollments: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          courseName: '$course.name',
          totalCollected: 1,
          totalExpected: 1,
          pending: { $subtract: ['$totalExpected', '$totalCollected'] },
          enrollments: 1
        }
      }
    ]);

    // Payment status distribution
    const paymentStatus = await Student.aggregate([
      { $match: { projectId: projectObjectId } },
      { $unwind: { path: '$enrolledCourses', preserveNullAndEmptyArrays: true } },
      { $match: { enrolledCourses: { $ne: null } } },
      {
        $group: {
          _id: '$enrolledCourses.paymentStatus',
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$enrolledCourses.amountPaid', 0] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        byCourse,
        paymentStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
