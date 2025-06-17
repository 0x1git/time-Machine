const mongoose = require('mongoose');
require('dotenv').config();

const TimeEntry = require('./models/TimeEntry');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');

async function testTimesheetWithDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker');
    console.log('Connected to MongoDB');
    
    // Find the user
    const user = await User.findOne({ name: 'hackerone tess' });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User:', user.name, '(', user._id, ')');
    
    // Get accessible projects (same logic as the API)
    const accessibleProjects = await Project.find({
      organization: user.organization,
      isActive: true,
      $or: [
        { owner: user._id },
        { 'members.user': user._id }
      ]
    }).select('_id name');
    
    const accessibleProjectIds = accessibleProjects.map(p => p._id);
    
    console.log('Accessible projects:', accessibleProjects.length);
    accessibleProjects.forEach(p => console.log('  -', p.name, '(', p._id, ')'));
    
    // Test with the same date filters as the frontend
    const startDate = '2025-05-18';
    const endDate = '2025-06-17';
    
    console.log('\n=== TESTING WITH DATE FILTERS ===');
    console.log('Start date:', startDate);
    console.log('End date:', endDate);
    
    let matchQuery = { 
      user: user._id,
      project: { $in: accessibleProjectIds }
    };
    
    console.log('Initial match query:', JSON.stringify(matchQuery, null, 2));
    
    // Apply the NEW date filtering logic
    if (startDate || endDate) {
      matchQuery.startTime = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchQuery.startTime.$gte = start;
        console.log('Start date filter:', start);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.startTime.$lte = end;
        console.log('End date filter:', end);
      }
    }
    
    console.log('Final match query with dates:', JSON.stringify(matchQuery, null, 2));
    
    // Run the aggregation
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
    
    console.log('\n=== AGGREGATION RESULT WITH NEW DATE LOGIC ===');
    console.log('Result:', totals[0] || { totalDuration: 0, billableDuration: 0, totalEntries: 0 });
    
    // Also get the individual entries to see what matches
    const entries = await TimeEntry.find(matchQuery).sort({ startTime: -1 });
    
    console.log('\n=== MATCHING ENTRIES ===');
    console.log('Found entries:', entries.length);
    entries.forEach((entry, i) => {
      console.log(`Entry ${i + 1}:`);
      console.log('  Start time:', entry.startTime);
      console.log('  Duration:', entry.duration, 'seconds');
      console.log('  Project:', entry.project);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testTimesheetWithDates();
