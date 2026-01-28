const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['call', 'email', 'meeting', 'sms', 'whatsapp', 'note', 'other'],
    required: true
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    default: 'outbound'
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  outcome: {
    type: String,
    enum: ['successful', 'no_response', 'interested', 'not_interested', 'follow_up_required', 'other'],
    default: 'other'
  },
  relatedTo: {
    type: String,
    enum: ['lead', 'student'],
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'relatedTo'
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attachments: [{
    name: String,
    type: String,
    url: String,
    size: Number
  }],
  scheduledFor: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
InteractionSchema.index({ projectId: 1, relatedTo: 1, relatedId: 1 });
InteractionSchema.index({ projectId: 1, performedBy: 1 });
InteractionSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('Interaction', InteractionSchema);
