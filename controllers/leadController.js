const Lead = require('../models/Lead');

// @desc    Get all leads for a project
// @route   GET /api/leads?projectId=xxx
// @access  Private
exports.getLeads = async (req, res) => {
  try {
    const { projectId, status, assignedTo, source, search } = req.query;

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required' });
    }

    let query = { projectId };

    // Filters
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (source) query.source = source;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .populate('interestedCourse', 'name')
      .populate('createdBy', 'name')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('interestedCourse', 'name')
      .populate('createdBy', 'name');

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new lead
// @route   POST /api/leads
// @access  Private
exports.createLead = async (req, res) => {
  try {
    // Ensure projectId is provided
    if (!req.body.projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required' });
    }

    // Normalize source field
    if (req.body.source) {
      req.body.source = req.body.source.toLowerCase().replace(/\s+/g, '_');
    }

    // Remove empty ObjectId fields
    if (req.body.interestedCourse === '' || req.body.interestedCourse === null) {
      delete req.body.interestedCourse;
    }
    if (req.body.assignedTo === '' || req.body.assignedTo === null) {
      delete req.body.assignedTo;
    }

    req.body.createdBy = req.user.id;

    const lead = await Lead.create(req.body);

    res.status(201).json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => error.errors[key].message) : []
    });
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
exports.updateLead = async (req, res) => {
  try {
    // Normalize source field
    if (req.body.source) {
      req.body.source = req.body.source.toLowerCase().replace(/\s+/g, '_');
    }

    // Remove empty ObjectId fields
    if (req.body.interestedCourse === '' || req.body.interestedCourse === null) {
      delete req.body.interestedCourse;
    }
    if (req.body.assignedTo === '' || req.body.assignedTo === null) {
      delete req.body.assignedTo;
    }

    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    await lead.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Calculate and update lead score
// @route   PUT /api/leads/:id/score
// @access  Private
exports.updateLeadScore = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Lead scoring logic
    let score = 0;

    // Status-based scoring
    const statusScores = {
      new: 20,
      contacted: 40,
      qualified: 60,
      negotiation: 80,
      converted: 100,
      lost: 0
    };
    score += statusScores[lead.status] || 0;

    // Interaction frequency (placeholder - would need actual interaction count)
    // score += interactions > 5 ? 20 : interactions * 4;

    // Days since creation (fresher leads get higher scores)
    const daysSinceCreation = Math.floor((Date.now() - lead.createdAt) / (1000 * 60 * 60 * 24));
    if (daysSinceCreation < 7) score += 20;
    else if (daysSinceCreation < 30) score += 10;

    // Cap score at 100
    lead.score = Math.min(score, 100);
    await lead.save();

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
