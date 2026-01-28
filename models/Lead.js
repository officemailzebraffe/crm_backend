const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    trim: true
  },
  alternatePhone: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'social_media', 'advertisement', 'direct', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'negotiation', 'converted', 'lost'],
    default: 'new'
  },
  interestedCourse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  lastContactedAt: {
    type: Date
  },
  convertedAt: {
    type: Date
  },
  convertedToStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Compound index for efficient querying
LeadSchema.index({ projectId: 1, status: 1 });
LeadSchema.index({ projectId: 1, assignedTo: 1 });
LeadSchema.index({ projectId: 1, createdAt: -1 });

// Update the updatedAt field on save
LeadSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Lead', LeadSchema);
