const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const { auth, authorize, requirePermission, requireOwnership } = require('../middleware/auth');
const { requireOrganization } = require('../middleware/organization');

const router = express.Router();

// @route   GET /api/projects
// @desc    Get all projects for user's organization
// @access  Private
router.get('/', [auth, requireOrganization], async (req, res) => {
  try {
    let query = { organization: req.organizationId, isActive: true };
    
    // Admin and managers with permission can see all projects in their organization
    if (req.user.permissions?.canViewAllProjects) {
      // Keep base query (all projects in organization)
    } else {
      // Regular users only see projects they own or are members of in their organization
      query = {
        ...query,
        $or: [
          { owner: req.user.id },
          { 'members.user': req.user.id }
        ]
      };
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/projects
// @desc    Create a project
// @access  Private
router.post('/', [
  auth,
  requireOrganization,
  requirePermission('canCreateProjects'),
  body('name').notEmpty().withMessage('Project name is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, color, deadline, budget, currency } = req.body;

    const project = new Project({
      name,
      description,
      color,
      organization: req.organizationId,
      owner: req.user.id,
      deadline,
      budget,
      currency,
      members: [{ user: req.user.id, role: 'admin' }]
    });

    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members.user', 'name email');

    res.status(201).json(project);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', [auth, requireOrganization], async (req, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id, 
      organization: req.organizationId 
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to project
    const hasAccess = project.owner._id.toString() === req.user.id ||
                     project.members.some(member => member.user._id.toString() === req.user.id) ||
                     req.user.permissions?.canViewAllProjects;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private
router.put('/:id', [auth, requireOrganization], async (req, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id, 
      organization: req.organizationId 
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }    // Check if user is owner or has admin/manager role
    const isOwner = project.owner.toString() === req.user.id;
    const isAdminOrManager = project.members.some(member => 
      member.user.toString() === req.user.id && ['admin', 'manager'].includes(member.teamRole)
    );
    const canManageAll = req.user.permissions?.canManageAllProjects;

    if (!isOwner && !isAdminOrManager && !canManageAll) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, description, color, deadline, budget, currency } = req.body;

    project.name = name || project.name;
    project.description = description || project.description;
    project.color = color || project.color;
    project.deadline = deadline || project.deadline;
    project.budget = budget || project.budget;
    project.currency = currency || project.currency;

    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members.user', 'name email');

    res.json(project);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/projects/:id/members
// @desc    Add member to project
// @access  Private
router.post('/:id/members', [
  auth,
  requireOrganization,
  body('userId').notEmpty().withMessage('User ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findOne({ 
      _id: req.params.id, 
      organization: req.organizationId 
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner or has admin/manager role in team
    const isOwner = project.owner.toString() === req.user.id;
    const isAdminOrManager = project.members.some(member => 
      member.user.toString() === req.user.id && ['admin', 'manager'].includes(member.teamRole)
    );

    if (!isOwner && !isAdminOrManager) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { userId } = req.body;

    // Find user by ID and ensure they're in the same organization
    const User = require('../models/User');
    const user = await User.findOne({ 
      _id: userId, 
      organization: req.organizationId,
      isActive: true 
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found in organization' });
    }

    // Find user's team role and permissions
    const Team = require('../models/Team');
    const team = await Team.findOne({
      organization: req.organizationId,
      'members.user': userId,
      isActive: true
    });

    if (!team) {
      return res.status(400).json({ message: 'User must be a team member to be added to projects' });
    }

    const teamMember = team.members.find(member => 
      member.user.toString() === userId
    );

    // Check if user is already a member
    const isMember = project.members.some(member => 
      member.user.toString() === user._id.toString()
    );

    if (isMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Check if user is the owner
    if (project.owner.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'User is already the project owner' });
    }

    // Add member with their team role and permissions
    project.members.push({ 
      user: user._id, 
      teamRole: teamMember.role,
      permissions: teamMember.permissions
    });
    await project.save();
    await project.populate('members.user', 'name email');

    res.json(project);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private
router.delete('/:id', [auth, requireOrganization], async (req, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id, 
      organization: req.organizationId 
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only owner or admin with delete permission can delete project
    const isOwner = project.owner.toString() === req.user.id;
    const canDelete = req.user.permissions?.canDeleteProjects;

    if (!isOwner && !canDelete) {
      return res.status(403).json({ message: 'Access denied' });
    }

    project.isActive = false;
    await project.save();

    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/projects/:id/members/:userId
// @desc    Remove member from project
// @access  Private
router.delete('/:id/members/:userId', [auth, requireOrganization], async (req, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id, 
      organization: req.organizationId 
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }    // Check if user is owner or has admin/manager role
    const isOwner = project.owner.toString() === req.user.id;
    const isAdminOrManager = project.members.some(member => 
      member.user.toString() === req.user.id && ['admin', 'manager'].includes(member.teamRole)
    );

    if (!isOwner && !isAdminOrManager) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find member to remove
    const memberIndex = project.members.findIndex(member => 
      member.user.toString() === req.params.userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found in project' });
    }

    // Cannot remove project owner
    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove project owner' });
    }

    project.members.splice(memberIndex, 1);
    await project.save();
    await project.populate('members.user', 'name email');

    res.json({ message: 'Member removed from project', project });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/projects/:id/available-members
// @desc    Get team members that can be added to project
// @access  Private
router.get('/:id/available-members', [auth, requireOrganization], async (req, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id, 
      organization: req.organizationId 
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to view project
    const isOwner = project.owner.toString() === req.user.id;
    const isMember = project.members.some(member => 
      member.user.toString() === req.user.id
    );
    const canViewAll = req.user.permissions?.canViewAllProjects;    if (!isOwner && !isMember && !canViewAll) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get team members from the organization
    const Team = require('../models/Team');
    const teams = await Team.find({ 
      organization: req.organizationId,
      isActive: true 
    }).populate('members.user', 'name email');

    // Collect all team members
    const allTeamMembers = [];
    teams.forEach(team => {
      team.members.forEach(member => {
        if (member.user && member.user.isActive !== false) {
          allTeamMembers.push({
            _id: member.user._id,
            name: member.user.name,
            email: member.user.email,
            teamRole: member.role
          });
        }
      });
    });

    // Remove duplicates (users can be in multiple teams)
    const uniqueMembers = allTeamMembers.reduce((acc, current) => {
      const exists = acc.find(member => member._id.toString() === current._id.toString());
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);

    // Filter out users who are already project members
    const projectMemberIds = project.members.map(member => member.user.toString());
    projectMemberIds.push(project.owner.toString()); // Include owner

    const availableMembers = uniqueMembers.filter(user => 
      !projectMemberIds.includes(user._id.toString())
    );

    res.json(availableMembers);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
