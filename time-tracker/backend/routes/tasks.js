const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Team = require('../models/Team');
const { auth } = require('../middleware/auth');
const { requireOrganization } = require('../middleware/organization');

const router = express.Router();

// Helper function to check if user can assign tasks
const canAssignTasks = async (userId, organizationId) => {
  try {
    // Find teams where the user is a member within the organization
    const teams = await Team.find({
      organization: organizationId,
      'members.user': userId,
      isActive: true
    });

    // Check if user has admin or manager role in any team, or has canManageTeam permission
    for (const team of teams) {
      const userMember = team.members.find(m => m.user.toString() === userId.toString());
      if (userMember) {
        // Admin or manager can assign tasks
        if (userMember.role === 'admin' || userMember.role === 'manager') {
          return true;
        }
        // Or if they have explicit canManageTeam permission
        if (userMember.permissions && userMember.permissions.canManageTeam) {
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking task assignment permissions:', error);
    return false;
  }
};

// @route   GET /api/tasks
// @desc    Get tasks for user within organization
// @access  Private
router.get('/', [auth, requireOrganization], async (req, res) => {
  try {
    const { project, status, assignee } = req.query;
    
    // Get user's projects within their organization
    const userProjects = await Project.find({
      organization: req.organizationId,
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ],
      isActive: true
    }).select('_id');

    const projectIds = userProjects.map(p => p._id);

    // Build query - only tasks from projects in user's organization
    let query = { 
      organization: req.organizationId,
      project: { $in: projectIds }, 
      isActive: true 
    };
    
    if (project) query.project = project;
    if (status) query.status = status;
    if (assignee) query.assignee = assignee;

    const tasks = await Task.find(query)
      .populate('project', 'name color')
      .populate('assignee', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/tasks
// @desc    Create a task
// @access  Private
router.post('/', [
  auth,
  requireOrganization,
  body('name').notEmpty().withMessage('Task name is required'),
  body('project').notEmpty().withMessage('Project is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, project, assignee, priority, estimatedHours, dueDate, tags } = req.body;    // Check if user has access to project within their organization
    const projectDoc = await Project.findOne({
      _id: project,
      organization: req.organizationId
    }).populate('owner', 'name email').populate('members.user', 'name email');
    
    if (!projectDoc) {
      console.log(`Project not found: ${project} in organization: ${req.organizationId}`);
      return res.status(404).json({ 
        message: 'Project not found',
        details: 'The selected project does not exist or you do not have access to it within your organization.',
        action: 'Please select a different project or contact your administrator.'
      });
    }

    const isOwner = projectDoc.owner._id.toString() === req.user.id;
    const isMember = projectDoc.members.some(member => member.user._id.toString() === req.user.id);
    const hasAccess = isOwner || isMember;

    if (!hasAccess) {
      console.log(`Access denied for user ${req.user.id} to project ${project}. Owner: ${projectDoc.owner._id}, Members: ${JSON.stringify(projectDoc.members.map(m => m.user._id))}`);
      
      // Create detailed error message
      const ownerName = projectDoc.owner.name;
      const memberNames = projectDoc.members.map(m => m.user.name).join(', ');
      
      return res.status(403).json({ 
        message: 'Access denied to project',
        details: `You are not authorized to create tasks in the project "${projectDoc.name}". Only the project owner and members can create tasks.`,
        projectInfo: {
          name: projectDoc.name,
          owner: ownerName,
          members: memberNames || 'No other members'
        },        action: 'To create tasks in this project, you need to be added as a project member. Please contact the project owner or your administrator.',
        solution: `Ask ${ownerName} (project owner) to add you to the project through the project management interface.`
      });
    }

    // Check if user is trying to assign task to someone else
    if (assignee && assignee !== req.user.id) {
      const canAssign = await canAssignTasks(req.user.id, req.organizationId);
      if (!canAssign) {
        return res.status(403).json({
          message: 'Permission denied',
          details: 'Only team admins and managers can assign tasks to other team members.',
          action: 'You can create tasks for yourself, or ask a team admin/manager to assign tasks to others.',
          solution: 'Contact your team admin or manager to get the necessary permissions.'
        });
      }
    }

    const task = new Task({
      name,
      description,
      organization: req.organizationId,
      project,
      assignee,
      priority,
      estimatedHours,
      dueDate,
      tags
    });

    await task.save();
    await task.populate('project', 'name color');
    await task.populate('assignee', 'name email');

    res.status(201).json(task);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', [auth, requireOrganization], async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      organization: req.organizationId
    })
      .populate('project', 'name color owner members')
      .populate('assignee', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to project
    const hasAccess = task.project.owner.toString() === req.user.id ||
                     task.project.members.some(member => member.user.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', [auth, requireOrganization], async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id,
      organization: req.organizationId
    }).populate('project', 'name owner members').populate('project.owner', 'name email').populate('project.members.user', 'name email');

    if (!task) {
      return res.status(404).json({ 
        message: 'Task not found',
        details: 'The task you are trying to update does not exist or you do not have access to it.',
        action: 'Please refresh the page or contact your administrator.'
      });
    }

    // Check if user has access to project
    const isOwner = task.project.owner._id.toString() === req.user.id;
    const isMember = task.project.members.some(member => member.user._id.toString() === req.user.id);
    const hasAccess = isOwner || isMember;

    if (!hasAccess) {
      const ownerName = task.project.owner.name;
      const memberNames = task.project.members.map(m => m.user.name).join(', ');
      
      return res.status(403).json({ 
        message: 'Access denied',
        details: `You are not authorized to update tasks in the project "${task.project.name}". Only the project owner and members can modify tasks.`,
        projectInfo: {
          name: task.project.name,
          owner: ownerName,
          members: memberNames || 'No other members'
        },
        action: 'To modify tasks in this project, you need to be added as a project member.',
        solution: `Ask ${ownerName} (project owner) to add you to the project through the project management interface.`
      });
    }

    const { name, description, project, assignee, status, priority, estimatedHours, dueDate, tags } = req.body;

    // If project is being changed, check access to new project
    if (project && project !== task.project._id.toString()) {
      const newProject = await Project.findOne({
        _id: project,
        organization: req.organizationId
      });
      
      if (!newProject) {
        return res.status(404).json({ message: 'New project not found' });
      }

      const hasNewProjectAccess = newProject.owner.toString() === req.user.id ||
                                 newProject.members.some(member => member.user.toString() === req.user.id);      if (!hasNewProjectAccess) {
        return res.status(403).json({ message: 'Access denied to new project' });
      }
    }

    // Check if user is trying to change task assignment to someone else
    if (assignee !== undefined && assignee !== task.assignee && assignee !== req.user.id) {
      const canAssign = await canAssignTasks(req.user.id, req.organizationId);
      if (!canAssign) {
        return res.status(403).json({
          message: 'Permission denied',
          details: 'Only team admins and managers can assign tasks to other team members.',
          action: 'You can assign tasks to yourself, or ask a team admin/manager to assign tasks to others.',
          solution: 'Contact your team admin or manager to get the necessary permissions.'
        });
      }
    }

    task.name = name || task.name;
    task.description = description !== undefined ? description : task.description;
    task.project = project || task.project;
    task.assignee = assignee !== undefined ? assignee : task.assignee;
    task.status = status || task.status;
    task.priority = priority || task.priority;
    task.estimatedHours = estimatedHours !== undefined ? estimatedHours : task.estimatedHours;
    task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;
    task.tags = tags || task.tags;

    await task.save();
    await task.populate('project', 'name color');
    await task.populate('assignee', 'name email');

    res.json(task);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', [auth, requireOrganization], async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      organization: req.organizationId
    }).populate('project', 'name owner members').populate('project.owner', 'name email').populate('project.members.user', 'name email');

    if (!task) {
      return res.status(404).json({ 
        message: 'Task not found',
        details: 'The task you are trying to delete does not exist or you do not have access to it.',
        action: 'Please refresh the page or contact your administrator.'
      });
    }

    // Check if user has access to project
    const isOwner = task.project.owner._id.toString() === req.user.id;
    const isMember = task.project.members.some(member => member.user._id.toString() === req.user.id);
    const hasAccess = isOwner || isMember;

    if (!hasAccess) {
      const ownerName = task.project.owner.name;
      const memberNames = task.project.members.map(m => m.user.name).join(', ');
      
      return res.status(403).json({ 
        message: 'Access denied',
        details: `You are not authorized to delete tasks in the project "${task.project.name}". Only the project owner and members can delete tasks.`,
        projectInfo: {
          name: task.project.name,
          owner: ownerName,
          members: memberNames || 'No other members'
        },
        action: 'To delete tasks in this project, you need to be added as a project member.',
        solution: `Ask ${ownerName} (project owner) to add you to the project through the project management interface.`
      });
    }

    task.isActive = false;
    await task.save();

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
