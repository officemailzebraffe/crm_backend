const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Please add a course name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  category: {
    type: String,
    enum: ['dsa', 'web_development', 'mobile_development', 'data_science', 'ai_ml', 'devops', 'other'],
    default: 'other'
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  duration: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months'],
      default: 'months'
    }
  },
  pricing: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    discount: {
      type: Number,
      default: 0
    },
    finalAmount: {
      type: Number
    }
  },
  curriculum: [{
    title: String,
    description: String,
    topics: [String],
    duration: String
  }],
  prerequisites: [String],
  outcomes: [String],
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  batches: [{
    name: String,
    startDate: Date,
    endDate: Date,
    schedule: String,
    capacity: Number,
    enrolled: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed'],
      default: 'upcoming'
    }
  }],
  thumbnail: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalEnrollments: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
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

// Calculate final amount before saving
CourseSchema.pre('save', function(next) {
  if (this.pricing.discount > 0) {
    this.pricing.finalAmount = this.pricing.amount - (this.pricing.amount * this.pricing.discount / 100);
  } else {
    this.pricing.finalAmount = this.pricing.amount;
  }
  this.updatedAt = Date.now();
  next();
});

// Indexes
CourseSchema.index({ projectId: 1, isActive: 1 });
CourseSchema.index({ projectId: 1, category: 1 });

module.exports = mongoose.model('Course', CourseSchema);
