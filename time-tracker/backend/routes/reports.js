const express = require('express');
const mongoose = require('mongoose');
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
router.get('/dashboard', [auth, requireOrganization], async (req, res) => {
  try {
    console.log('🏠 DASHBOARD API CALLED - USER:', req.user.name);
    
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get accessible projects for filtering
    const accessibleProjects = await getAccessibleProjects(req.user._id, req.organizationId, req.user.permissions);
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
    const activeProjects = accessibleProjects.length;    // Recent time entries (only from accessible projects)
    const recentEntries = await TimeEntry.find({ 
      user: req.user._id,
      project: { $in: accessibleProjectIds }
    })
      .populate('project', 'name color')
      .populate('task', 'name')
      .sort({ startTime: -1 })
      .limit(5);

    // Running time entry (only from accessible projects)
    const runningEntry = await TimeEntry.findOne({ 
      user: req.user._id, 
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
    const accessibleProjects = await getAccessibleProjects(req.user._id, req.organizationId, req.user.permissions);
    const accessibleProjectIds = accessibleProjects.map(p => p._id);
    
    let matchQuery = { 
      user: req.user._id,
      project: { $in: accessibleProjectIds }
    };
      if (startDate || endDate) {
      matchQuery.startTime = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchQuery.startTime.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.startTime.$lte = end;
      }
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
    const { days = 7 } = req.query;    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    // Get accessible projects for filtering
    const accessibleProjects = await getAccessibleProjects(req.user._id, req.organizationId, req.user.permissions);
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
router.get('/timesheet', [auth, requireOrganization], async (req, res) => {  try {
    const { startDate, endDate, project, page = 1, limit = 50 } = req.query;
    
    // Get accessible projects for filtering
    const accessibleProjects = await getAccessibleProjects(req.user._id, req.organizationId, req.user.permissions);
    const accessibleProjectIds = accessibleProjects.map(p => p._id);
    
    let matchQuery = { 
      user: req.user._id,
      project: { $in: accessibleProjectIds }
    };
      if (startDate || endDate) {
      matchQuery.startTime = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchQuery.startTime.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.startTime.$lte = end;
      }
    }    // If specific project is requested, ensure user has access to it
    if (project) {
      if (accessibleProjectIds.map(id => id.toString()).includes(project)) {
        matchQuery.project = new mongoose.Types.ObjectId(project);
      } else {
        return res.status(403).json({ message: 'Access denied to this project' });
      }
    }

    const timeEntries = await TimeEntry.find(matchQuery)
      .populate('project', 'name color')
      .populate('task', 'name')
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);    const total = await TimeEntry.countDocuments(matchQuery);

    console.log('🔍 BACKEND DEBUG: matchQuery for totals:', JSON.stringify(matchQuery, null, 2));
    
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

    console.log('🔍 BACKEND DEBUG: aggregation result:', totals);

    res.json({
      timeEntries,
      totals: totals[0] || { totalDuration: 0, billableDuration: 0, totalEntries: 0 },
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });} catch (error) {
    console.error('Error in timesheet endpoint:', error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/reports/project-team/:projectId
// @desc    Get team-based project report
// @access  Private (team members only)
router.get('/project-team/:projectId', [auth, requireOrganization], async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify user has access to this project
    const project = await Project.findOne({
      _id: projectId,
      organization: req.organizationId,
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    }).populate('members.user', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    // Set date range - default to last 30 days if not provided
    const endDateTime = endDate ? new Date(endDate) : new Date();
    const startDateTime = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Set end date to end of day
    endDateTime.setHours(23, 59, 59, 999);
    startDateTime.setHours(0, 0, 0, 0);

    // Get all team members who have worked on this project
    const timeEntries = await TimeEntry.find({
      project: projectId,
      startTime: { $gte: startDateTime, $lte: endDateTime }
    })
    .populate('user', 'name email')
    .populate('task', 'name')
    .sort({ startTime: -1 });

    // Group by user and calculate totals
    const userStats = {};
    let totalProjectTime = 0;

    timeEntries.forEach(entry => {
      if (!entry.user) return; // Skip entries with deleted users
      
      const userId = entry.user._id.toString();
      if (!userStats[userId]) {
        userStats[userId] = {
          user: entry.user,
          totalTime: 0,
          entries: [],
          firstEntry: entry.startTime,
          lastEntry: entry.startTime
        };
      }

      userStats[userId].totalTime += entry.duration;
      userStats[userId].entries.push(entry);
      totalProjectTime += entry.duration;

      // Track first and last work times
      if (entry.startTime < userStats[userId].firstEntry) {
        userStats[userId].firstEntry = entry.startTime;
      }
      if (entry.startTime > userStats[userId].lastEntry) {
        userStats[userId].lastEntry = entry.startTime;
      }
    });

    // Convert to array and sort by total time
    const teamStats = Object.values(userStats).sort((a, b) => b.totalTime - a.totalTime);

    // Daily breakdown
    const dailyStats = {};
    timeEntries.forEach(entry => {
      if (!entry.user) return;
      
      const date = entry.startTime.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { total: 0, users: {} };
      }
      
      const userId = entry.user._id.toString();
      if (!dailyStats[date].users[userId]) {
        dailyStats[date].users[userId] = {
          user: entry.user,
          time: 0
        };
      }
      
      dailyStats[date].users[userId].time += entry.duration;
      dailyStats[date].total += entry.duration;
    });

    res.json({
      project: {
        _id: project._id,
        name: project.name,
        color: project.color
      },
      dateRange: {
        startDate: startDateTime,
        endDate: endDateTime
      },
      summary: {
        totalTime: totalProjectTime,
        totalUsers: teamStats.length,
        totalEntries: timeEntries.length
      },
      teamStats,
      dailyStats: Object.entries(dailyStats).map(([date, data]) => ({
        date,
        total: data.total,
        users: Object.values(data.users)
      })).sort((a, b) => new Date(a.date) - new Date(b.date)),
      recentEntries: timeEntries.slice(0, 20) // Latest 20 entries
    });

  } catch (error) {
    console.error('Error in project team report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/team-overview
// @desc    Get overview of all projects user has access to with team data
// @access  Private
router.get('/team-overview', [auth, requireOrganization], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Set date range
    const endDateTime = endDate ? new Date(endDate) : new Date();
    const startDateTime = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    endDateTime.setHours(23, 59, 59, 999);
    startDateTime.setHours(0, 0, 0, 0);

    // Get accessible projects
    const accessibleProjects = await getAccessibleProjects(req.user._id, req.organizationId, req.user.permissions);
    const accessibleProjectIds = accessibleProjects.map(p => p._id);

    // Get time entries for all accessible projects
    const timeEntries = await TimeEntry.find({
      project: { $in: accessibleProjectIds },
      startTime: { $gte: startDateTime, $lte: endDateTime }
    })
    .populate('user', 'name email')
    .populate('project', 'name color');

    // Group by project
    const projectStats = {};
    
    timeEntries.forEach(entry => {
      if (!entry.user || !entry.project) return;
      
      const projectId = entry.project._id.toString();
      if (!projectStats[projectId]) {
        projectStats[projectId] = {
          project: entry.project,
          totalTime: 0,
          users: {},
          entryCount: 0
        };
      }

      const userId = entry.user._id.toString();
      if (!projectStats[projectId].users[userId]) {
        projectStats[projectId].users[userId] = {
          user: entry.user,
          time: 0
        };
      }

      projectStats[projectId].users[userId].time += entry.duration;
      projectStats[projectId].totalTime += entry.duration;
      projectStats[projectId].entryCount++;
    });

    // Convert to array and add user arrays
    const projectsOverview = Object.values(projectStats).map(project => ({
      ...project,
      users: Object.values(project.users).sort((a, b) => b.time - a.time),
      userCount: Object.keys(project.users).length
    })).sort((a, b) => b.totalTime - a.totalTime);

    res.json({
      dateRange: {
        startDate: startDateTime,
        endDate: endDateTime
      },
      projects: projectsOverview,
      summary: {
        totalProjects: projectsOverview.length,
        totalTime: projectsOverview.reduce((sum, p) => sum + p.totalTime, 0),
        totalUsers: new Set(timeEntries.map(e => e.user?._id?.toString()).filter(Boolean)).size
      }
    });

  } catch (error) {
    console.error('Error in team overview report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
