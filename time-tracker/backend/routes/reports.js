const express = require('express');
const TimeEntry = require('../models/TimeEntry');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');
const { requireOrganization } = require('../middleware/organization');

const router = express.Router();

// Helper function to get projects accessible to user
const getAccessibleProjects = async (userId, organizationId, userPermissions) => {
  let query = { organization: organizationId, isActive: true };
  
  // Admin and managers with permission can see all projects in their organization
  if (userPermissions?.canViewAllProjects) {
    // Keep base query (all projects in organization)
  } else {
    // Regular users only see projects they own or are members of
    query = {
      ...query,
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    };
  }
  
  return await Project.find(query).select('_id name');
};

// @route   GET /api/reports/dashboard
// @desc    Get dashboard data
// @access  Private
router.get('/dashboard', [auth, requireOrganization], async (req, res) => {  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get accessible projects for filtering
    const accessibleProjects = await getAccessibleProjects(req.user.id, req.organizationId, req.user.permissions);
    const accessibleProjectIds = accessibleProjects.map(p => p._id);

    // Today's time (only from accessible projects)
    const todayTime = await TimeEntry.aggregate([
      {
        $match: {
          user: req.user._id,
          project: { $in: accessibleProjectIds },
          startTime: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: '$duration' }
        }
      }
    ]);

    // This week's time (only from accessible projects)
    const weekTime = await TimeEntry.aggregate([
      {
        $match: {
          user: req.user._id,
          project: { $in: accessibleProjectIds },
          startTime: { $gte: startOfWeek }
        }
      },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: '$duration' }
        }
      }
    ]);

    // This month's time (only from accessible projects)
    const monthTime = await TimeEntry.aggregate([
      {
        $match: {
          user: req.user._id,
          project: { $in: accessibleProjectIds },
          startTime: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: '$duration' }
        }
      }
    ]);    // Active projects count (accessible projects only)
    const activeProjects = accessibleProjects.length;

    // Recent time entries (only from accessible projects)
    const recentEntries = await TimeEntry.find({ 
      user: req.user.id,
      project: { $in: accessibleProjectIds }
    })
      .populate('project', 'name color')
      .populate('task', 'name')
      .sort({ startTime: -1 })
      .limit(5);

    // Running time entry (only from accessible projects)
    const runningEntry = await TimeEntry.findOne({ 
      user: req.user.id, 
      project: { $in: accessibleProjectIds },
      isRunning: true 
    })
    .populate('project', 'name color')
    .populate('task', 'name');

    res.json({
      todayTime: todayTime[0]?.totalDuration || 0,
      weekTime: weekTime[0]?.totalDuration || 0,
      monthTime: monthTime[0]?.totalDuration || 0,
      activeProjects,
      recentEntries,
      runningEntry
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/reports/time-by-project
// @desc    Get time breakdown by project
// @access  Private
router.get('/time-by-project', [auth, requireOrganization], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get accessible projects for filtering
    const accessibleProjects = await getAccessibleProjects(req.user.id, req.organizationId, req.user.permissions);
    const accessibleProjectIds = accessibleProjects.map(p => p._id);
    
    let matchQuery = { 
      user: req.user._id,
      project: { $in: accessibleProjectIds }
    };
    
    if (startDate || endDate) {
      matchQuery.startTime = {};
      if (startDate) matchQuery.startTime.$gte = new Date(startDate);
      if (endDate) matchQuery.startTime.$lte = new Date(endDate);
    }

    const projectTime = await TimeEntry.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$project',
          totalDuration: { $sum: '$duration' },
          entryCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'project'
        }
      },
      {
        $unwind: '$project'
      },
      {
        $project: {
          _id: 0,
          projectId: '$_id',
          projectName: '$project.name',
          projectColor: '$project.color',
          totalDuration: 1,
          entryCount: 1
        }
      },
      { $sort: { totalDuration: -1 } }
    ]);

    res.json(projectTime);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/reports/daily-activity
// @desc    Get daily activity for the past week
// @access  Private
router.get('/daily-activity', [auth, requireOrganization], async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    // Get accessible projects for filtering
    const accessibleProjects = await getAccessibleProjects(req.user.id, req.organizationId, req.user.permissions);
    const accessibleProjectIds = accessibleProjects.map(p => p._id);

    const dailyActivity = await TimeEntry.aggregate([
      {
        $match: {
          user: req.user._id,
          project: { $in: accessibleProjectIds },
          startTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$startTime' },
            month: { $month: '$startTime' },
            day: { $dayOfMonth: '$startTime' }
          },
          totalDuration: { $sum: '$duration' },
          entryCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          totalDuration: 1,
          entryCount: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json(dailyActivity);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/reports/timesheet
// @desc    Get detailed timesheet
// @access  Private
router.get('/timesheet', [auth, requireOrganization], async (req, res) => {
  try {
    const { startDate, endDate, project, page = 1, limit = 50 } = req.query;
    
    // Get accessible projects for filtering
    const accessibleProjects = await getAccessibleProjects(req.user.id, req.organizationId, req.user.permissions);
    const accessibleProjectIds = accessibleProjects.map(p => p._id);
    
    let matchQuery = { 
      user: req.user._id,
      project: { $in: accessibleProjectIds }
    };
    
    if (startDate || endDate) {
      matchQuery.startTime = {};
      if (startDate) matchQuery.startTime.$gte = new Date(startDate);
      if (endDate) matchQuery.startTime.$lte = new Date(endDate);
    }
    
    // If specific project is requested, ensure user has access to it
    if (project) {
      if (accessibleProjectIds.map(id => id.toString()).includes(project)) {
        matchQuery.project = project;
      } else {
        return res.status(403).json({ message: 'Access denied to this project' });
      }
    }

    const timeEntries = await TimeEntry.find(matchQuery)
      .populate('project', 'name color')
      .populate('task', 'name')
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TimeEntry.countDocuments(matchQuery);

    // Calculate totals
    const totals = await TimeEntry.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: '$duration' },
          billableDuration: {
            $sum: {
              $cond: [{ $eq: ['$billable', true] }, '$duration', 0]
            }
          },
          totalEntries: { $sum: 1 }
        }
      }
    ]);

    res.json({
      timeEntries,
      totals: totals[0] || { totalDuration: 0, billableDuration: 0, totalEntries: 0 },
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
