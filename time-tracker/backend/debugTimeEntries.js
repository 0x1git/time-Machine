const mongoose = require('mongoose');
require('dotenv').config();

const TimeEntry = require('./models/TimeEntry');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');

async function debugTimeEntries() {
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
    console.log('User org:', user.organization);
    
    // Find all time entries for this user
    const allEntries = await TimeEntry.find({ user: user._id })
      .populate('project', 'name organization')
      .populate('task', 'name')
      .sort({ startTime: -1 });
    
    console.log('\n=== ALL TIME ENTRIES FOR USER ===');
    console.log('Total entries:', allEntries.length);
    
    allEntries.forEach((entry, index) => {
      console.log(`Entry ${index + 1}:`);
      console.log('  Duration:', entry.duration, 'minutes');
      console.log('  Start:', entry.startTime);
      console.log('  End:', entry.endTime);
      console.log('  Project:', entry.project?.name, '(', entry.project?._id, ')');
      console.log('  Project Org:', entry.project?.organization);
      console.log('  Task:', entry.task?.name || 'No task');
      console.log('  Billable:', entry.billable);
      console.log('  Running:', entry.isRunning);
      console.log('---');
    });
    
    // Find projects accessible to this user in their organization
    const accessibleProjects = await Project.find({
      organization: user.organization,
      isActive: true,
      $or: [
        { owner: user._id },
        { 'members.user': user._id }
      ]
    }).select('_id name');
    
    console.log('\n=== ACCESSIBLE PROJECTS ===');
    console.log('Total accessible projects:', accessibleProjects.length);
    accessibleProjects.forEach(p => {
      console.log('  -', p.name, '(', p._id, ')');
    });
    
    // Check which entries are from accessible projects
    const accessibleProjectIds = accessibleProjects.map(p => p._id.toString());
    const entriesFromAccessibleProjects = allEntries.filter(entry => 
      accessibleProjectIds.includes(entry.project?._id?.toString())
    );
    
    console.log('\n=== ENTRIES FROM ACCESSIBLE PROJECTS ===');
    console.log('Entries from accessible projects:', entriesFromAccessibleProjects.length);
    
    const totalDuration = entriesFromAccessibleProjects.reduce((sum, entry) => sum + entry.duration, 0);
    console.log('Total duration from accessible projects:', totalDuration, 'minutes');
    
    // Check today's entries
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const todayEntries = entriesFromAccessibleProjects.filter(entry => 
      entry.startTime >= startOfDay && entry.startTime <= endOfDay
    );
    
    console.log('\n=== TODAY\'S ENTRIES FROM ACCESSIBLE PROJECTS ===');
    console.log('Today\'s entries:', todayEntries.length);
    const todayDuration = todayEntries.reduce((sum, entry) => sum + entry.duration, 0);
    console.log('Today\'s total duration:', todayDuration, 'minutes');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugTimeEntries();
