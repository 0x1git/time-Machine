const mongoose = require('mongoose');
const TimeEntry = require('./models/TimeEntry');
const User = require('./models/User');
const Project = require('./models/Project');

require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker');

async function analyzeTimeEntries() {
  try {
    console.log('Analyzing existing time entries...');
    
    const entries = await TimeEntry.find()
      .populate('user', 'name email organization')
      .populate('project', 'name organization owner members');
    
    console.log(`Total entries: ${entries.length}`);
    
    entries.forEach((entry, index) => {
      console.log(`\nEntry ${index + 1}:`);
      console.log(`  User: ${entry.user?.name || 'Unknown'} (${entry.user?._id})`);
      console.log(`  User Org: ${entry.user?.organization}`);
      console.log(`  Project: ${entry.project?.name || 'Unknown'} (${entry.project?._id})`);
      console.log(`  Project Org: ${entry.project?.organization}`);
      console.log(`  Project Owner: ${entry.project?.owner}`);
      console.log(`  Duration: ${entry.duration}s`);
      console.log(`  Organization Match: ${entry.user?.organization?.toString() === entry.project?.organization?.toString()}`);
    });
    
    // Check all users
    const users = await User.find();
    console.log('\nAll users:');
    users.forEach(user => {
      console.log(`  ${user.name} (${user._id}) - Org: ${user.organization}`);
    });
    
    // Check all projects
    const projects = await Project.find();
    console.log('\nAll projects:');
    projects.forEach(project => {
      console.log(`  ${project.name} (${project._id}) - Org: ${project.organization}, Owner: ${project.owner}`);
    });
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

analyzeTimeEntries();
