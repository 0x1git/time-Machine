const User = require('../models/User');

// Middleware to ensure user has access to their organization's data
const requireOrganization = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('organization');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.organization) {
      return res.status(403).json({ message: 'User not associated with any organization' });
    }

    // Add organization to request object for use in routes
    req.organization = user.organization;
    req.organizationId = user.organization._id;

    next();
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

// Middleware to filter queries by organization
const organizationScope = (modelName) => {
  return (req, res, next) => {
    // Add organization filter to all queries
    if (req.organizationId) {
      req.organizationFilter = { organization: req.organizationId };
    }
    next();
  };
};

module.exports = { requireOrganization, organizationScope };
