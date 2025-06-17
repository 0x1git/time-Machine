const express = require('express');
const mongoose = require('mongoose');
const TimeEntry = require('./models/TimeEntry');
const Project = require('./models/Project');
const User = require('./models/User');

require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker');

async function testReportsEndpoint() {
  try {
    console.log('Testing reports timesheet endpoint logic...');
    
    // Get a sample user
    const sampleUser = await User.findOne();
    if (!sampleUser) {
      console.log('No users found in database');
      return;
    }
    console.log(`Testing with user: ${sampleUser.name} (${sampleUser._id})`);
    
    // Get user's organization
    const organizationId = sampleUser.organization;
    console.log(`User's organization: ${organizationId}`);
    
    // Simulate the getAccessibleProjects logic
    const accessibleProjects = await Project.find({ 
      organization: organizationId, 
      isActive: true,
      $or: [
        { owner: sampleUser._id },
        { 'members.user': sampleUser._id }
      ]
    }).select('_id name');
    
    console.log(`Accessible projects: ${accessibleProjects.length}`);
    accessibleProjects.forEach(p => console.log(`  - ${p.name} (${p._id})`));
    
    const accessibleProjectIds = accessibleProjects.map(p => p._id);
    
    // Test the timesheet query
    let matchQuery = { 
      user: sampleUser._id,
      project: { $in: accessibleProjectIds }
    };
    
    console.log('Match query:', JSON.stringify(matchQuery, null, 2));
    
    const timeEntries = await TimeEntry.find(matchQuery)
      .populate('project', 'name color')
      .populate('task', 'name');
    
    console.log(`Found ${timeEntries.length} time entries for this user`);
    
    // Calculate totals like in the API
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
    
    console.log('Totals from aggregation:', totals[0] || { totalDuration: 0, billableDuration: 0, totalEntries: 0 });
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

testReportsEndpoint();
