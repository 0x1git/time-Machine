const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');
const { requireOrganization } = require('../middleware/organization');

const router = express.Router();

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

    const { name, description, project, assignee, priority, estimatedHours, dueDate, tags } = req.body;

    // Check if user has access to project
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const hasAccess = projectDoc.owner.toString() === req.user.id ||
                     projectDoc.members.some(member => member.user.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }    const task = new Task({
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
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
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
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to project
    const hasAccess = task.project.owner.toString() === req.user.id ||
                     task.project.members.some(member => member.user.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, description, assignee, status, priority, estimatedHours, dueDate, tags } = req.body;

    task.name = name || task.name;
    task.description = description || task.description;
    task.assignee = assignee || task.assignee;
    task.status = status || task.status;
    task.priority = priority || task.priority;
    task.estimatedHours = estimatedHours || task.estimatedHours;
    task.dueDate = dueDate || task.dueDate;
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
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to project
    const hasAccess = task.project.owner.toString() === req.user.id ||
                     task.project.members.some(member => member.user.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    task.isActive = false;
    await task.save();

    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
