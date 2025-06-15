const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }
    next();
  };
};

// Permission-based authorization
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.user.permissions || !req.user.permissions[permission]) {
      return res.status(403).json({ 
        message: `Access denied. Missing permission: ${permission}` 
      });
    }
    
    next();
  };
};

// Resource ownership check
const requireOwnership = (resourceModel, resourceField = 'user') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Check if user owns the resource or has admin privileges
      const isOwner = resource[resourceField].toString() === req.user.id;
      const isAdmin = req.user.role === 'admin';
      const canManageAll = req.user.permissions?.canManageAllProjects || 
                          req.user.permissions?.canManageAllTasks ||
                          req.user.permissions?.canViewAllTimeEntries;

      if (!isOwner && !isAdmin && !canManageAll) {
        return res.status(403).json({ 
          message: 'Access denied. You can only access your own resources.' 
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  };
};

// Team membership check
const requireTeamMembership = async (req, res, next) => {
  try {
    const Team = require('../models/Team');
    const teamId = req.params.teamId || req.body.teamId;
    
    if (!teamId) {
      return res.status(400).json({ message: 'Team ID required' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is team owner, member, or has admin privileges
    const isOwner = team.owner.toString() === req.user.id;
    const isMember = team.members.some(member => 
      member.user.toString() === req.user.id
    );
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isMember && !isAdmin) {
      return res.status(403).json({ 
        message: 'Access denied. You are not a member of this team.' 
      });
    }

    req.team = team;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  auth, 
  authorize, 
  requirePermission, 
  requireOwnership, 
  requireTeamMembership 
};
