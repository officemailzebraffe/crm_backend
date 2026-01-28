const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user has access to the project
exports.checkProjectAccess = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId || req.query.projectId;
    
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required' });
    }

    // Admin has access to all projects
    if (req.user.role === 'admin') {
      req.projectId = projectId;
      return next();
    }

    // Check if user has access to this project
    const hasAccess = req.user.projects.some(
      p => p.projectId.toString() === projectId.toString()
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this project'
      });
    }

    req.projectId = projectId;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Check if user has specific permission
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has the required permission
    if (!req.user.permissions || !req.user.permissions[permission]) {
      return res.status(403).json({
        success: false,
        error: `You don't have permission to access ${permission}`
      });
    }

    next();
  };
};
