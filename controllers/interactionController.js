const Interaction = require('../models/Interaction');

// @desc    Get all interactions
// @route   GET /api/interactions?projectId=xxx
// @access  Private
exports.getInteractions = async (req, res) => {
  try {
    const { projectId, relatedTo, relatedId, type, performedBy } = req.query;

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required' });
    }

    let query = { projectId };

    if (relatedTo) query.relatedTo = relatedTo;
    if (relatedId) query.relatedId = relatedId;
    if (type) query.type = type;
    if (performedBy) query.performedBy = performedBy;

    const interactions = await Interaction.find(query)
      .populate('performedBy', 'name email')
      .populate('relatedId')
      .populate('taskId')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: interactions.length,
      data: interactions
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single interaction
// @route   GET /api/interactions/:id
// @access  Private
exports.getInteraction = async (req, res) => {
  try {
    const interaction = await Interaction.findById(req.params.id)
      .populate('performedBy', 'name email')
      .populate('relatedId')
      .populate('taskId');

    if (!interaction) {
      return res.status(404).json({ success: false, error: 'Interaction not found' });
    }

    res.status(200).json({
      success: true,
      data: interaction
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new interaction
// @route   POST /api/interactions
// @access  Private
exports.createInteraction = async (req, res) => {
  try {
    req.body.performedBy = req.user.id;

    if (!req.body.completedAt) {
      req.body.completedAt = Date.now();
    }

    const interaction = await Interaction.create(req.body);

    // Update last contacted date for lead
    if (req.body.relatedTo === 'lead') {
      const Lead = require('../models/Lead');
      await Lead.findByIdAndUpdate(req.body.relatedId, {
        lastContactedAt: Date.now()
      });
    }

    res.status(201).json({
      success: true,
      data: interaction
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update interaction
// @route   PUT /api/interactions/:id
// @access  Private
exports.updateInteraction = async (req, res) => {
  try {
    const interaction = await Interaction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!interaction) {
      return res.status(404).json({ success: false, error: 'Interaction not found' });
    }

    res.status(200).json({
      success: true,
      data: interaction
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete interaction
// @route   DELETE /api/interactions/:id
// @access  Private
exports.deleteInteraction = async (req, res) => {
  try {
    const interaction = await Interaction.findById(req.params.id);

    if (!interaction) {
      return res.status(404).json({ success: false, error: 'Interaction not found' });
    }

    await interaction.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
