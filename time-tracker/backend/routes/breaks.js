const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Break = require('../models/Break');
const TimeEntry = require('../models/TimeEntry');
const Project = require('../models/Project');
const { auth, requirePermission } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/breaks
// @desc    Get all breaks for user with optional filters
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      project, 
      breakType,
      page = 1, 
      limit = 50 
    } = req.query;

    const query = { user: req.user.id };

    // Date range filter
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    // Project filter
    if (project) {
      query.project = project;
    }

    // Break type filter
    if (breakType) {
      query.breakType = breakType;
    }

    const breaks = await Break.find(query)
      .populate('project', 'name color')
      .populate('timeEntry', 'description startTime')
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Break.countDocuments(query);

    res.json({
      breaks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/breaks/active
// @desc    Get current active break for user
// @access  Private
router.get('/active', auth, async (req, res) => {
  try {
    const activeBreak = await Break.findOne({
      user: req.user.id,
      isActive: true
    })
    .populate('project', 'name color')
    .populate('timeEntry', 'description startTime');

    res.json(activeBreak);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/breaks/start
// @desc    Start a break
// @access  Private
router.post('/start', [
  auth,
  body('timeEntryId').notEmpty().withMessage('Time entry ID is required'),
  body('breakType').optional().isIn(['lunch', 'coffee', 'personal', 'meeting', 'other']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { timeEntryId, breakType = 'other', description, isPaid = false } = req.body;

    // Check if user has an active break
    const existingBreak = await Break.findOne({
      user: req.user.id,
      isActive: true
    });

    if (existingBreak) {
      return res.status(400).json({ message: 'You already have an active break' });
    }

    // Get the time entry and verify it belongs to user and is running
    const timeEntry = await TimeEntry.findOne({
      _id: timeEntryId,
      user: req.user.id,
      isRunning: true
    }).populate('project');

    if (!timeEntry) {
      return res.status(404).json({ message: 'Active time entry not found' });
    }

    // Create new break
    const breakEntry = new Break({
      user: req.user.id,
      timeEntry: timeEntryId,
      project: timeEntry.project._id,
      breakType,
      description,
      startTime: new Date(),
      isPaid
    });

    await breakEntry.save();

    // Update time entry to indicate user is on break
    timeEntry.isOnBreak = true;
    timeEntry.breaks.push(breakEntry._id);
    await timeEntry.save();

    await breakEntry.populate('project', 'name color');
    await breakEntry.populate('timeEntry', 'description startTime');

    res.status(201).json(breakEntry);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/breaks/end/:id
// @desc    End a break
// @access  Private
router.put('/end/:id', auth, async (req, res) => {
  try {
    const breakEntry = await Break.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true
    });

    if (!breakEntry) {
      return res.status(404).json({ message: 'Active break not found' });
    }

    // End the break
    breakEntry.endTime = new Date();
    breakEntry.isActive = false;
    await breakEntry.save();

    // Update the associated time entry
    const timeEntry = await TimeEntry.findById(breakEntry.timeEntry);
    if (timeEntry) {
      timeEntry.isOnBreak = false;
      // Calculate total break time for this time entry
      const allBreaks = await Break.find({ timeEntry: timeEntry._id, isActive: false });
      timeEntry.totalBreakTime = allBreaks.reduce((total, brk) => total + brk.duration, 0);
      await timeEntry.save();
    }

    await breakEntry.populate('project', 'name color');
    await breakEntry.populate('timeEntry', 'description startTime');

    res.json(breakEntry);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/breaks/:id
// @desc    Update a break
// @access  Private
router.put('/:id', [
  auth,
  body('breakType').optional().isIn(['lunch', 'coffee', 'personal', 'meeting', 'other']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { breakType, description, isPaid } = req.body;

    const breakEntry = await Break.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!breakEntry) {
      return res.status(404).json({ message: 'Break not found' });
    }

    // Update fields
    if (breakType !== undefined) breakEntry.breakType = breakType;
    if (description !== undefined) breakEntry.description = description;
    if (isPaid !== undefined) breakEntry.isPaid = isPaid;

    await breakEntry.save();

    await breakEntry.populate('project', 'name color');
    await breakEntry.populate('timeEntry', 'description startTime');

    res.json(breakEntry);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/breaks/:id
// @desc    Delete a break
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const breakEntry = await Break.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!breakEntry) {
      return res.status(404).json({ message: 'Break not found' });
    }

    // If break is active, end it first
    if (breakEntry.isActive) {
      const timeEntry = await TimeEntry.findById(breakEntry.timeEntry);
      if (timeEntry) {
        timeEntry.isOnBreak = false;
        await timeEntry.save();
      }
    }

    // Remove break from time entry
    await TimeEntry.findByIdAndUpdate(
      breakEntry.timeEntry,
      { $pull: { breaks: breakEntry._id } }
    );

    await Break.findByIdAndDelete(req.params.id);

    // Recalculate total break time for the time entry
    const timeEntry = await TimeEntry.findById(breakEntry.timeEntry);
    if (timeEntry) {
      const remainingBreaks = await Break.find({ timeEntry: timeEntry._id, isActive: false });
      timeEntry.totalBreakTime = remainingBreaks.reduce((total, brk) => total + brk.duration, 0);
      await timeEntry.save();
    }

    res.json({ message: 'Break deleted' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/breaks/reports/summary
// @desc    Get break summary for reports
// @access  Private
router.get('/reports/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate, userId, projectId } = req.query;

    const matchQuery = {};

    // Date range filter
    if (startDate || endDate) {
      matchQuery.startTime = {};
      if (startDate) matchQuery.startTime.$gte = new Date(startDate);
      if (endDate) matchQuery.startTime.$lte = new Date(endDate);
    }    // User filter (for managers/admins)
    if (userId) {
      matchQuery.user = new mongoose.Types.ObjectId(userId);
    } else {
      matchQuery.user = new mongoose.Types.ObjectId(req.user.id);
    }    // Project filter
    if (projectId) {
      matchQuery.project = new mongoose.Types.ObjectId(projectId);
    }

    const summary = await Break.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            user: '$user',
            breakType: '$breakType'
          },
          totalDuration: { $sum: '$duration' },
          totalBreaks: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $group: {
          _id: '$_id.user',
          userName: { $first: '$user.name' },
          userEmail: { $first: '$user.email' },
          breakTypes: {
            $push: {
              type: '$_id.breakType',
              totalDuration: '$totalDuration',
              totalBreaks: '$totalBreaks',
              avgDuration: '$avgDuration'
            }
          },
          totalBreakTime: { $sum: '$totalDuration' },
          totalBreaks: { $sum: '$totalBreaks' }
        }
      },
      { $sort: { totalBreakTime: -1 } }
    ]);

    res.json(summary);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
