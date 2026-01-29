const Task = require('../models/Task');

// @desc    Get all tasks
// @route   GET /api/tasks?projectId=xxx
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    let { projectId, status, priority, assignedTo, relatedTo, relatedId } = req.query;

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

    // Role-based filtering: employees see only their assigned tasks or unassigned tasks
    if (req.user.role === 'employee') {
      query.$or = [
        { assignedTo: req.user.id },
        { assignedTo: null },
        { assignedTo: { $exists: false } }
      ];
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (relatedTo) query.relatedTo = relatedTo;
    if (relatedId) query.relatedId = relatedId;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name')
      .populate('relatedId')
      .populate('statusHistory.changedBy', 'name email')
      .sort('dueDate');

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name')
      .populate('relatedId')
      .populate('statusHistory.changedBy', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    req.body.assignedBy = req.user.id;

    // If projectId is not provided, use user's activeProject
    if (!req.body.projectId && req.user.activeProject) {
      req.body.projectId = req.user.activeProject;
    }

    // Validate projectId is provided
    if (!req.body.projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID is required. Please select a project first.' 
      });
    }

    const task = await Task.create(req.body);

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    // Get the existing task first to track status changes
    const existingTask = await Task.findById(req.params.id);
    
    if (!existingTask) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Permission check for employees
    if (req.user.role === 'employee') {
      const isAssignedToUser = existingTask.assignedTo && existingTask.assignedTo.toString() === req.user.id;
      const isUnassigned = !existingTask.assignedTo;
      
      // Employees can only update tasks assigned to them or unassigned tasks
      if (!isAssignedToUser && !isUnassigned) {
        return res.status(403).json({ 
          success: false, 
          error: 'You do not have permission to update this task' 
        });
      }
      
      // Employees can only change status, not other fields
      const allowedFields = ['status'];
      const attemptedFields = Object.keys(req.body);
      const hasUnauthorizedFields = attemptedFields.some(field => !allowedFields.includes(field));
      
      if (hasUnauthorizedFields) {
        return res.status(403).json({ 
          success: false, 
          error: 'Employees can only update task status' 
        });
      }
    }

    // If status is being changed, add to statusHistory
    if (req.body.status && req.body.status !== existingTask.status) {
      const statusEntry = {
        status: req.body.status,
        changedBy: req.user.id,
        changedAt: new Date(),
        previousStatus: existingTask.status
      };
      
      // Add to statusHistory array
      if (!existingTask.statusHistory) {
        existingTask.statusHistory = [];
      }
      existingTask.statusHistory.push(statusEntry);
      req.body.statusHistory = existingTask.statusHistory;
    }

    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name')
      .populate('statusHistory.changedBy', 'name email');

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Permission check: only admins and managers can delete tasks
    if (req.user.role === 'employee') {
      return res.status(403).json({ 
        success: false, 
        error: 'You do not have permission to delete tasks' 
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get my tasks
// @route   GET /api/tasks/me
// @access  Private
exports.getMyTasks = async (req, res) => {
  try {
    const { projectId, status } = req.query;

    let query = { assignedTo: req.user.id };

    if (projectId) query.projectId = projectId;
    if (status) query.status = status;

    const tasks = await Task.find(query)
      .populate('assignedBy', 'name')
      .populate('relatedId')
      .sort('dueDate');

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
