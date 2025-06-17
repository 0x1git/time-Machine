const mongoose = require('mongoose');
const TimeEntry = require('./models/TimeEntry');
const User = require('./models/User');
const Project = require('./models/Project');

require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker');

async function createTestTimeEntries() {
  try {
    console.log('Creating test time entries for current user...');
    
    // Get the current user (Gitesh Bharambe)
    const user = await User.findOne({ name: 'Gitesh Bharambe' });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    // Get the user's project (GCOEJ Project)
    const project = await Project.findOne({ 
      organization: user.organization,
      name: 'GCOEJ Project'
    });
    
    if (!project) {
      console.log('Project not found');
      return;
    }
    
    console.log(`Creating entries for user: ${user.name} in project: ${project.name}`);
    
    // Create some test time entries
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const testEntries = [
      {
        organization: user.organization,
        user: user._id,
        project: project._id,
        description: 'Morning work session',
        startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9 AM today
        endTime: new Date(today.getTime() + 11 * 60 * 60 * 1000), // 11 AM today
        duration: 2 * 60 * 60, // 2 hours
        billable: true,
        isRunning: false
      },
      {
        organization: user.organization,
        user: user._id,
        project: project._id,
        description: 'Afternoon work session',
        startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2 PM today
        endTime: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 5 PM today
        duration: 3 * 60 * 60, // 3 hours
        billable: true,
        isRunning: false
      },
      {
        organization: user.organization,
        user: user._id,
        project: project._id,
        description: 'Yesterday work',
        startTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 10 AM yesterday
        endTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000), // 1 PM yesterday
        duration: 3 * 60 * 60, // 3 hours
        billable: false,
        isRunning: false
      }
    ];
    
    const createdEntries = await TimeEntry.insertMany(testEntries);
    console.log(`Created ${createdEntries.length} test time entries`);
    
    // Verify the entries
    const totalDuration = testEntries.reduce((sum, entry) => sum + entry.duration, 0);
    console.log(`Total duration: ${totalDuration} seconds (${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m)`);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

createTestTimeEntries();
