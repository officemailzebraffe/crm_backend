const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a project name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  type: {
    type: String,
    enum: ['education', 'ecommerce', 'saas', 'consulting', 'other'],
    default: 'other'
  },
  logo: {
    type: String,
    default: ''
  },
  settings: {
    currency: {
      type: String,
      default: 'INR'
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY'
    },
    leadSources: [{
      type: String
    }],
    leadStatuses: [{
      name: String,
      color: String
    }],
    studentStatuses: [{
      name: String,
      color: String
    }],
    taskPriorities: [{
      name: String,
      color: String
    }],
    customFields: {
      leads: [{
        name: String,
        type: { type: String, enum: ['text', 'number', 'date', 'dropdown', 'boolean'] },
        options: [String],
        required: Boolean
      }],
      students: [{
        name: String,
        type: { type: String, enum: ['text', 'number', 'date', 'dropdown', 'boolean'] },
        options: [String],
        required: Boolean
      }]
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'manager', 'admin'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
ProjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', ProjectSchema);
