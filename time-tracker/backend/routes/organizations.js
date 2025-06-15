const express = require('express');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { auth, requirePermission } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/organizations/current
// @desc    Get current user's organization
// @access  Private
router.get('/current', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('organization');
    
    if (!user || !user.organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json(user.organization);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/organizations/current
// @desc    Update current user's organization
// @access  Private (Admin only)
router.put('/current', [auth, requirePermission('canManageSettings')], async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || !user.organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const {
      name,
      description,
      website,
      industry,
      size,
      timezone,
      currency,
      settings
    } = req.body;

    const organization = await Organization.findById(user.organization);
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Update organization fields
    if (name) organization.name = name;
    if (description !== undefined) organization.description = description;
    if (website !== undefined) organization.website = website;
    if (industry !== undefined) organization.industry = industry;
    if (size) organization.size = size;
    if (timezone) organization.timezone = timezone;
    if (currency) organization.currency = currency;
    if (settings) {
      organization.settings = { ...organization.settings, ...settings };
    }

    await organization.save();

    res.json(organization);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/organizations/stats
// @desc    Get organization statistics
// @access  Private (Admin only)
router.get('/stats', [auth, requirePermission('canViewAllReports')], async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || !user.organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const organizationId = user.organization;

    // Get stats
    const stats = await Promise.all([
      User.countDocuments({ organization: organizationId, isActive: true }),
      require('../models/Project').countDocuments({ organization: organizationId }),
      require('../models/Task').countDocuments({ organization: organizationId }),
      require('../models/TimeEntry').countDocuments({ organization: organizationId })
    ]);

    res.json({
      usersCount: stats[0],
      projectsCount: stats[1],
      tasksCount: stats[2],
      timeEntriesCount: stats[3]
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
