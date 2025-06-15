const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const Team = require('../models/Team');
const User = require('../models/User');
const { auth, authorize, requirePermission } = require('../middleware/auth');
const { requireOrganization } = require('../middleware/organization');
const emailService = require('../services/emailService');

const router = express.Router();

// @route   GET /api/teams
// @desc    Get all teams for user
// @access  Private
router.get('/', [auth, requireOrganization], async (req, res) => {
  try {
    const teams = await Team.find({
      $and: [
        { organization: req.organizationId },
        {
          $or: [
            { owner: req.user.id },
            { 'members.user': req.user.id }
          ]
        },
        { isActive: true }
      ]
    })
    .populate('owner', 'name email')
    .populate('members.user', 'name email avatar')
    .populate('invitations.invitedBy', 'name email')
    .sort({ createdAt: -1 });

    res.json(teams);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/teams
// @desc    Create a team
// @access  Private
router.post('/', [
  auth,
  requireOrganization,
  body('name').notEmpty().withMessage('Team name is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    const team = new Team({
      name,
      description,
      organization: req.organizationId,
      owner: req.user.id,
      members: [{
        user: req.user.id,
        role: 'admin',
        permissions: {
          canCreateProjects: true,
          canManageTeam: true,
          canViewReports: true,
          canManageTasks: true
        }
      }]
    });

    await team.save();
    await team.populate('owner', 'name email');
    await team.populate('members.user', 'name email avatar');

    res.json(team);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/teams/:id/invite
// @desc    Invite user to team
// @access  Private
router.post('/:id/invite', [
  auth,
  requireOrganization,
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['admin', 'manager', 'member']).withMessage('Valid role is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, role } = req.body;
    const team = await Team.findOne({ 
      _id: req.params.id, 
      organization: req.organizationId 
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user has permission to invite
    const userMember = team.members.find(member => 
      member.user.toString() === req.user.id && 
      (member.role === 'admin' || member.permissions.canManageTeam)
    );

    if (!userMember && team.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to invite members' });
    }

    // Check if user is already a member
    const existingMember = team.members.find(member => 
      member.user.email === email
    );

    if (existingMember) {
      return res.status(400).json({ message: 'User is already a team member' });
    }

    // Check if invitation already exists
    const existingInvitation = team.invitations.find(inv => 
      inv.email === email && inv.status === 'pending'
    );

    if (existingInvitation) {
      return res.status(400).json({ message: 'Invitation already sent to this email' });
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');

    // Add invitation
    team.invitations.push({
      email,
      role,
      invitedBy: req.user.id,
      token: invitationToken    });

    await team.save();

    // Send invitation email
    try {
      const invitedByUser = await User.findById(req.user.id);
      await emailService.sendTeamInvitation(
        email, 
        team.name, 
        invitedByUser.name, 
        invitationToken, 
        role
      );
      console.log(`Invitation email sent to ${email} for team ${team.name}`);
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Continue execution even if email fails - invitation is still saved
    }

    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/teams/accept-invitation/:token
// @desc    Accept team invitation
// @access  Private
router.post('/accept-invitation/:token', auth, async (req, res) => {
  try {
    const team = await Team.findOne({
      'invitations.token': req.params.token,
      'invitations.status': 'pending'
    }).populate('organization');

    if (!team) {
      return res.status(404).json({ message: 'Invalid or expired invitation' });
    }

    const invitation = team.invitations.find(inv => 
      inv.token === req.params.token && inv.status === 'pending'
    );

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Check if invitation has expired
    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await team.save();
      return res.status(400).json({ message: 'Invitation has expired' });
    }

    // Check if user email matches invitation email
    const user = await User.findById(req.user.id);
    if (user.email !== invitation.email) {
      return res.status(403).json({ message: 'This invitation was not sent to your email' });
    }

    // Check if user is already a member
    const existingMember = team.members.find(member => 
      member.user.toString() === req.user.id
    );

    if (existingMember) {
      return res.status(400).json({ message: 'You are already a member of this team' });
    }

    // Assign user to the team's organization if they don't have one or have a different one
    if (!user.organization || user.organization.toString() !== team.organization._id.toString()) {
      user.organization = team.organization._id;
      await user.save();
    }

    // Add user to team
    team.members.push({
      user: req.user.id,
      role: invitation.role
    });

    // Mark invitation as accepted
    invitation.status = 'accepted';

    await team.save();
    await team.populate('members.user', 'name email avatar');

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.name, team.name);
      console.log(`Welcome email sent to ${user.email} for team ${team.name}`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue execution even if email fails
    }    res.json({ message: 'Successfully joined the team', team });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/teams/:id/members/:userId/role
// @desc    Update team member role
// @access  Private
router.put('/:id/members/:userId/role', [
  auth,
  requireOrganization,
  body('role').isIn(['admin', 'manager', 'member']).withMessage('Valid role is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role } = req.body;
    const team = await Team.findOne({ 
      _id: req.params.id, 
      organization: req.organizationId 
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user has permission to manage team
    const userMember = team.members.find(member => 
      member.user.toString() === req.user.id && 
      (member.role === 'admin' || member.permissions.canManageTeam)
    );

    if (!userMember && team.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to manage team members' });
    }

    // Find member to update
    const memberToUpdate = team.members.find(member => 
      member.user.toString() === req.params.userId
    );

    if (!memberToUpdate) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    // Update role
    memberToUpdate.role = role;

    await team.save();
    await team.populate('members.user', 'name email avatar');

    res.json(team);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/teams/:id/members/:userId
// @desc    Remove team member
// @access  Private
router.delete('/:id/members/:userId', [auth, requireOrganization], async (req, res) => {
  try {
    const team = await Team.findOne({ 
      _id: req.params.id, 
      organization: req.organizationId 
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user has permission to manage team
    const userMember = team.members.find(member => 
      member.user.toString() === req.user.id && 
      (member.role === 'admin' || member.permissions.canManageTeam)
    );

    if (!userMember && team.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to manage team members' });
    }

    // Don't allow removing team owner
    if (team.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove team owner' });
    }

    // Remove member
    team.members = team.members.filter(member => 
      member.user.toString() !== req.params.userId
    );

    await team.save();

    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/teams/:id/invitations
// @desc    Get team invitations
// @access  Private
router.get('/:id/invitations', [auth, requireOrganization], async (req, res) => {
  try {
    const team = await Team.findOne({ 
      _id: req.params.id, 
      organization: req.organizationId 
    })
      .populate('invitations.invitedBy', 'name email');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user has permission to view invitations
    const userMember = team.members.find(member => 
      member.user.toString() === req.user.id && 
      (member.role === 'admin' || member.permissions.canManageTeam)
    );

    if (!userMember && team.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view invitations' });
    }

    res.json(team.invitations.filter(inv => inv.status === 'pending'));
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');  }
});

// @route   DELETE /api/teams/:id/invitations/:invitationId
// @desc    Cancel team invitation
// @access  Private
router.delete('/:id/invitations/:invitationId', [auth, requireOrganization], async (req, res) => {
  try {
    const team = await Team.findOne({ 
      _id: req.params.id, 
      organization: req.organizationId 
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user has permission to manage team
    const userMember = team.members.find(member => 
      member.user.toString() === req.user.id && 
      (member.role === 'admin' || member.permissions.canManageTeam)
    );

    if (!userMember && team.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel invitations' });
    }

    // Find invitation
    const invitationIndex = team.invitations.findIndex(inv => 
      inv._id.toString() === req.params.invitationId
    );

    if (invitationIndex === -1) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    const invitation = team.invitations[invitationIndex];

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: `Cannot cancel invitation with status: ${invitation.status}` });
    }

    // Remove the invitation
    team.invitations.splice(invitationIndex, 1);
    await team.save();

    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/teams/invitation/:token
// @desc    Get invitation details (public - for registration)
// @access  Public
router.get('/invitation/:token', async (req, res) => {
  try {
    const team = await Team.findOne({
      'invitations.token': req.params.token,
      'invitations.status': 'pending'
    }).populate('organization');

    if (!team) {
      return res.status(404).json({ message: 'Invalid or expired invitation' });
    }

    const invitation = team.invitations.find(inv => 
      inv.token === req.params.token && inv.status === 'pending'
    );

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Check if invitation has expired
    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ message: 'Invitation has expired' });
    }

    // Return invitation details for registration
    res.json({
      email: invitation.email,
      role: invitation.role,
      teamName: team.name,
      organizationName: team.organization.name,
      organizationId: team.organization._id,
      invitedBy: invitation.invitedBy
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
