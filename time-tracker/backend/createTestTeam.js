const mongoose = require('mongoose');
const User = require('./models/User');
const Team = require('./models/Team');
const Organization = require('./models/Organization');

require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker');

async function createTestTeam() {
  try {
    console.log('Creating test team...');
    
    // Find admin user and other users
    const adminUser = await User.findOne({ email: 'admin@timetracker.com' });
    const otherUsers = await User.find({ 
      email: { $ne: 'admin@timetracker.com' },
      organization: adminUser.organization 
    }).limit(2);
    
    console.log('Admin user:', adminUser.name);
    console.log('Other users found:', otherUsers.length);
    
    // Create a test team
    const testTeam = new Team({
      name: 'Test Team',
      description: 'A test team for debugging remove functionality',
      organization: adminUser.organization,
      owner: adminUser._id,
      members: [
        {
          user: adminUser._id,
          role: 'admin',
          permissions: {
            canCreateProjects: true,
            canManageTeam: true,
            canViewReports: true,
            canManageTasks: true
          }
        }
      ]
    });
    
    // Add other users as members if available
    if (otherUsers.length > 0) {
      for (let i = 0; i < Math.min(2, otherUsers.length); i++) {
        testTeam.members.push({
          user: otherUsers[i]._id,
          role: i === 0 ? 'manager' : 'member',
          permissions: {
            canCreateProjects: i === 0,
            canManageTeam: false,
            canViewReports: true,
            canManageTasks: false
          }
        });
      }
    }
    
    await testTeam.save();
    console.log('Test team created:', testTeam.name);
    console.log('Team members:', testTeam.members.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

createTestTeam();
