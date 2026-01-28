const User = require('../models/User');
const Project = require('../models/Project');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, permissions, projects } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Create user with permissions
    const userData = {
      name,
      email,
      password,
      phone,
      role: role || 'employee'
    };

    // Add permissions if provided
    if (permissions) {
      userData.permissions = permissions;
    }

    // Add projects if provided
    if (projects && Array.isArray(projects)) {
      userData.projects = projects;
      // Set first project as active if exists
      if (projects.length > 0) {
        userData.activeProject = projects[0].projectId;
      }
    }

    // Add createdBy if request is from an authenticated admin
    if (req.user && req.user.role === 'admin') {
      userData.createdBy = req.user.id;
    }

    user = await User.create(userData);

    await sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    await sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('projects.projectId activeProject');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      avatar: req.body.avatar
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({ success: false, error: 'Password is incorrect' });
    }

    user.password = req.body.newPassword;
    await user.save();

    await sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Remove refresh token from database
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }

    // Clear cookies
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'No refresh token provided' 
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid refresh token' 
      });
    }

    // Check if refresh token exists in database
    const tokenExists = await RefreshToken.findOne({ 
      token: refreshToken,
      userId: decoded.id 
    });

    if (!tokenExists) {
      return res.status(401).json({ 
        success: false, 
        error: 'Refresh token not found or expired' 
      });
    }

    // Get user and create new tokens
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Delete old refresh token
    await RefreshToken.deleteOne({ token: refreshToken });

    // Send new tokens
    await sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Switch active project
// @route   PUT /api/auth/switch-project/:projectId
// @access  Private
exports.switchProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if user has access to this project
    const hasAccess = req.user.projects.some(
      p => p.projectId.toString() === projectId.toString()
    ) || req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this project'
      });
    }

    // Update active project
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { activeProject: projectId },
      { new: true }
    ).populate('projects.projectId activeProject');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = async (user, statusCode, res) => {
  try {
    // Create access token
    const token = user.getSignedJwtToken();

    // Create refresh token
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Save refresh token to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt,
      ipAddress: res.req?.ip,
      userAgent: res.req?.headers['user-agent'],
    });

    const tokenOptions = {
      expires: new Date(
        Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      sameSite: 'strict',
    };

    const refreshTokenOptions = {
      expires: expiresAt,
      httpOnly: true,
      sameSite: 'strict',
    };

    if (process.env.NODE_ENV === 'production') {
      tokenOptions.secure = true;
      refreshTokenOptions.secure = true;
    }

    // Remove password from output
    const userObj = user.toObject();
    delete userObj.password;

    res
      .status(statusCode)
      .cookie('token', token, tokenOptions)
      .cookie('refreshToken', refreshToken, refreshTokenOptions)
      .json({
        success: true,
        token,
        refreshToken,
        data: userObj
      });
  } catch (error) {
    console.error('sendTokenResponse error:', error);
    throw error;
  }
};
