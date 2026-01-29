const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please add a task title'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  type: {
    type: String,
    enum: ['call', 'email', 'meeting', 'follow_up', 'demo', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relatedTo: {
    type: String,
    enum: ['lead', 'student']
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedTo'
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String
  },
  reminder: {
    enabled: {
      type: Boolean,
      default: false
    },
    time: Date
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'in-progress', 'completed', 'cancelled'],
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    previousStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'in-progress', 'completed', 'cancelled']
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
TaskSchema.index({ projectId: 1, assignedTo: 1, status: 1 });
TaskSchema.index({ projectId: 1, dueDate: 1 });
TaskSchema.index({ relatedTo: 1, relatedId: 1 });

// Update the updatedAt field on save
TaskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Task', TaskSchema);
