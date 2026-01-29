const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: [
      'admin',
      'hr_manager',
      'department_head',
      'project_manager',
      'team_lead',
      'senior_developer',
      'developer',
      'junior_developer',
      'designer',
      'qa_engineer',
      'business_analyst',
      'manager',
      'employee',
      'intern',
      'contractor'
    ],
    default: 'employee'
  },
  department: {
    type: String,
    enum: [
      'Engineering',
      'Product',
      'Design',
      'Marketing',
      'Sales',
      'HR',
      'Finance',
      'Operations',
      'Customer Support',
      'Quality Assurance',
      'DevOps',
      'Data Science',
      'Management',
      'Other'
    ],
    default: 'Other'
  },
  designation: {
    type: String,
    trim: true
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  dateOfJoining: {
    type: Date
  },
  dateOfBirth: {
    type: Date
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  employmentType: {
    type: String,
    enum: ['full_time', 'part_time', 'contract', 'intern', 'freelance'],
    default: 'full_time'
  },
  salary: {
    amount: { type: Number, select: false },
    currency: { type: String, default: 'INR', select: false }
  },
  reportingTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  skills: [{
    type: String,
    trim: true
  }],
  permissions: {
    dashboard: { type: Boolean, default: true },
    employees: { type: Boolean, default: false },
    leads: { type: Boolean, default: false },
    students: { type: Boolean, default: false },
    courses: { type: Boolean, default: false },
    attendance: { type: Boolean, default: false },
    leaves: { type: Boolean, default: false },
    payroll: { type: Boolean, default: false },
    tasks: { type: Boolean, default: false },
    projects: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
    reports: { type: Boolean, default: false },
    settings: { type: Boolean, default: false }
  },
  avatar: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  projects: [{
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'manager', 'admin'],
      default: 'viewer'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  activeProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
