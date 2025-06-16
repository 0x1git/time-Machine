const express = require('express');
const { body, validationResult } = require('express-validator');
const TimeEntry = require('../models/TimeEntry');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');
const { requireOrganization } = require('../middleware/organization');

const router = express.Router();

// @route   GET /api/time-entries
// @desc    Get time entries for user
// @access  Private
router.get('/', [auth, requireOrganization], async (req, res) => {
  try {
    const { project, task, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    // Build query with organization filtering
    let query = { 
      user: req.user.id,
      organization: req.organizationId 
    };
    
    if (project) query.project = project;
    if (task) query.task = task;
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const timeEntries = await TimeEntry.find(query)
      .populate('project', 'name color')
      .populate('task', 'name')
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TimeEntry.countDocuments(query);

    res.json({
      timeEntries,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching time entries:', error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/time-entries
// @desc    Create a time entry
// @access  Private
router.post('/', [
  auth,
  requireOrganization,
  body('project').notEmpty().withMessage('Project is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { project, task, description, startTime, endTime, duration, hourlyRate, billable, tags } = req.body;

    // Check if user has access to project and project belongs to user's organization
    const projectDoc = await Project.findOne({ 
      _id: project, 
      organization: req.organizationId 
    });
    
    if (!projectDoc) {
      return res.status(404).json({ message: 'Project not found in your organization' });
    }

    const hasAccess = projectDoc.owner.toString() === req.user.id ||
                     projectDoc.members.some(member => member.user.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if task belongs to project (if task is provided)
    if (task) {
      const taskDoc = await Task.findOne({ 
        _id: task, 
        project: project,
        organization: req.organizationId 
      });
      if (!taskDoc) {
        return res.status(400).json({ message: 'Task not found or does not belong to project' });
      }
    }

    const timeEntry = new TimeEntry({
      organization: req.organizationId,
      user: req.user.id,
      project,
      task,
      description,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      duration: duration || 0,
      hourlyRate,
      billable,
      tags,
      isRunning: !endTime
    });

    await timeEntry.save();
    await timeEntry.populate('project', 'name color');
    await timeEntry.populate('task', 'name');

    res.status(201).json(timeEntry);
  } catch (error) {
    console.error('Error creating time entry:', error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/time-entries/:id
// @desc    Update time entry
// @access  Private
router.put('/:id', [auth, requireOrganization], async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findOne({ 
      _id: req.params.id, 
      organization: req.organizationId 
    });

    if (!timeEntry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    // Check if user owns the time entry
    if (timeEntry.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { description, startTime, endTime, duration, hourlyRate, billable, tags } = req.body;

    timeEntry.description = description || timeEntry.description;
    timeEntry.startTime = startTime ? new Date(startTime) : timeEntry.startTime;
    timeEntry.endTime = endTime ? new Date(endTime) : timeEntry.endTime;
    timeEntry.duration = duration !== undefined ? duration : timeEntry.duration;
    timeEntry.hourlyRate = hourlyRate !== undefined ? hourlyRate : timeEntry.hourlyRate;
    timeEntry.billable = billable !== undefined ? billable : timeEntry.billable;
    timeEntry.tags = tags || timeEntry.tags;

    await timeEntry.save();
    await timeEntry.populate('project', 'name color');
    await timeEntry.populate('task', 'name');

    res.json(timeEntry);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/time-entries/:id/stop
// @desc    Stop running time entry
// @access  Private
router.post('/:id/stop', [auth, requireOrganization], async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findOne({ 
      _id: req.params.id, 
      organization: req.organizationId 
    });

    if (!timeEntry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    // Check if user owns the time entry
    if (timeEntry.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!timeEntry.isRunning) {
      return res.status(400).json({ message: 'Time entry is not running' });
    }

    timeEntry.endTime = new Date();
    timeEntry.isRunning = false;
    
    await timeEntry.save();
    await timeEntry.populate('project', 'name color');
    await timeEntry.populate('task', 'name');

    res.json(timeEntry);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/time-entries/running
// @desc    Get current running time entry
// @access  Private
router.get('/running', [auth, requireOrganization], async (req, res) => {
  try {
    const runningEntry = await TimeEntry.findOne({ 
      user: req.user.id, 
      organization: req.organizationId,
      isRunning: true 
    })
    .populate('project', 'name color')
    .populate('task', 'name');

    res.json(runningEntry);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/time-entries/:id
// @desc    Delete time entry
// @access  Private
router.delete('/:id', [auth, requireOrganization], async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findOne({ 
      _id: req.params.id, 
      organization: req.organizationId 
    });

    if (!timeEntry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    // Check if user owns the time entry
    if (timeEntry.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await TimeEntry.findByIdAndDelete(req.params.id);

    res.json({ message: 'Time entry deleted' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
