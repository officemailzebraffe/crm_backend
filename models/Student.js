const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true
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
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  status: {
    type: String,
    enum: ['prospect', 'enrolled', 'active', 'completed', 'dropped', 'alumni'],
    default: 'prospect'
  },
  enrolledCourses: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    batchName: String,
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    completionDate: Date,
    status: {
      type: String,
      enum: ['enrolled', 'in-progress', 'completed', 'dropped'],
      default: 'enrolled'
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'completed'],
      default: 'pending'
    },
    amountPaid: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    }
  }],
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  education: {
    qualification: String,
    institution: String,
    yearOfPassing: Number
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  parentLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot be more than 2000 characters']
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
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

// Compound indexes
StudentSchema.index({ projectId: 1, status: 1 });
StudentSchema.index({ projectId: 1, assignedTo: 1 });
StudentSchema.index({ projectId: 1, createdAt: -1 });

// Generate unique student ID before saving
StudentSchema.pre('save', async function(next) {
  if (!this.studentId) {
    const count = await this.constructor.countDocuments({ projectId: this.projectId });
    this.studentId = `STU${String(count + 1).padStart(6, '0')}`;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Student', StudentSchema);
