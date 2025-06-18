const mongoose = require('mongoose');
const TimeEntry = require('./models/TimeEntry');
const User = require('./models/User');
const Project = require('./models/Project');

require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkData() {
  try {
    console.log('🔍 Checking database contents...');
    
    const userCount = await User.countDocuments();
    console.log('👥 Total users:', userCount);
    
    if (userCount > 0) {
      const users = await User.find().limit(3);
      console.log('📋 Sample users:');
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ID: ${user._id}`);
      });
    }
    
    const projectCount = await Project.countDocuments();
    console.log('📁 Total projects:', projectCount);
    
    if (projectCount > 0) {
      const projects = await Project.find().limit(3);
      console.log('📋 Sample projects:');
      projects.forEach(project => {
        console.log(`  - ${project.name} - Owner: ${project.owner} - ID: ${project._id}`);
      });
    }
    
    const entryCount = await TimeEntry.countDocuments();
    console.log('⏱️ Total time entries:', entryCount);
    
    if (entryCount > 0) {
      const entries = await TimeEntry.find().limit(3).populate('user', 'name').populate('project', 'name');
      console.log('📋 Sample time entries:');
      entries.forEach(entry => {
        console.log(`  - User: ${entry.user?.name || 'Unknown'}, Project: ${entry.project?.name || 'Unknown'}, Duration: ${entry.duration}s`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkData();
