const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('projects.projectId', 'name')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('projects.projectId', 'name type');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      role: req.body.role,
      isActive: req.body.isActive,
      permissions: req.body.permissions
    };

    // Update projects if provided
    if (req.body.projects !== undefined) {
      fieldsToUpdate.projects = req.body.projects;
      // Set first project as active if exists and no active project
      if (req.body.projects.length > 0) {
        const currentUser = await User.findById(req.params.id);
        if (!currentUser.activeProject) {
          fieldsToUpdate.activeProject = req.body.projects[0].projectId;
        }
      }
    }

    // Update activeProject if provided
    if (req.body.activeProject) {
      fieldsToUpdate.activeProject = req.body.activeProject;
    }

    const user = await User.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create employee (admin only)
// @route   POST /api/users
// @access  Private (Admin)
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, phone, role, permissions } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Create employee
    user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'employee',
      permissions: permissions || {
        dashboard: true,
        leads: false,
        students: false,
        courses: false,
        tasks: false,
        analytics: false,
        projects: false,
        settings: false
      },
      createdBy: req.user.id
    });

    const userWithoutPassword = await User.findById(user._id).select('-password');

    res.status(201).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
