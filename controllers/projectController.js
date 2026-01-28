const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    let query;

    // Admin can see all projects, others see only their projects
    if (req.user.role === 'admin') {
      query = Project.find();
    } else {
      const projectIds = req.user.projects.map(p => p.projectId);
      query = Project.find({ _id: { $in: projectIds } });
    }

    const projects = await query
      .populate('owner', 'name email')
      .populate('team.userId', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('team.userId', 'name email');

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Check access
    const hasAccess = req.user.role === 'admin' ||
      project.owner.toString() === req.user.id ||
      req.user.projects.some(p => p.projectId.toString() === project._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin/Manager)
exports.createProject = async (req, res) => {
  try {
    // Add owner to req.body
    req.body.owner = req.user.id;

    const project = await Project.create(req.body);

    // Add project to user's projects
    await User.findByIdAndUpdate(req.user.id, {
      $push: {
        projects: {
          projectId: project._id,
          role: 'admin'
        }
      },
      activeProject: project._id
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Check if user is owner or admin
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to update this project' });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Owner/Admin)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Check if user is owner or admin
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this project' });
    }

    await project.deleteOne();

    // Remove project from all users
    await User.updateMany(
      { 'projects.projectId': project._id },
      { $pull: { projects: { projectId: project._id } } }
    );

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Add team member to project
// @route   POST /api/projects/:id/team
// @access  Private
exports.addTeamMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Check if requester is owner or admin
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Check if user already in team
    const exists = project.team.some(member => member.userId.toString() === userId);
    if (exists) {
      return res.status(400).json({ success: false, error: 'User already in team' });
    }

    // Add to project team
    project.team.push({ userId, role });
    await project.save();

    // Add project to user's projects
    await User.findByIdAndUpdate(userId, {
      $push: {
        projects: {
          projectId: project._id,
          role
        }
      }
    });

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Remove team member from project
// @route   DELETE /api/projects/:id/team/:userId
// @access  Private
exports.removeTeamMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Check if requester is owner or admin
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Remove from project team
    project.team = project.team.filter(
      member => member.userId.toString() !== req.params.userId
    );
    await project.save();

    // Remove project from user
    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { projects: { projectId: project._id } }
    });

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
