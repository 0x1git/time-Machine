const mongoose = require('mongoose');
const User = require('./models/User');
const Team = require('./models/Team');

require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker');

async function addMembersToTestTeam() {
  try {
    console.log('Adding members to test team...');
    
    // Find admin user and test team
    const adminUser = await User.findOne({ email: 'admin@timetracker.com' });
    const testTeam = await Team.findOne({ name: 'Test Team', owner: adminUser._id });
    
    console.log('Found test team:', testTeam?.name);
    
    // Find some other users (regardless of organization for testing)
    const otherUsers = await User.find({ 
      email: { $ne: 'admin@timetracker.com' }
    }).limit(3);
    
    console.log('Found other users:', otherUsers.map(u => ({ name: u.name, email: u.email })));
    
    // Add them to the test team
    for (let i = 0; i < otherUsers.length; i++) {
      const user = otherUsers[i];
      
      // Check if already a member
      const existingMember = testTeam.members.find(m => m.user.toString() === user._id.toString());
      if (existingMember) {
        console.log('User already a member:', user.name);
        continue;
      }
      
      console.log('Adding member:', user.name);
      testTeam.members.push({
        user: user._id,
        role: i === 0 ? 'manager' : 'member',
        permissions: {
          canCreateProjects: i === 0,
          canManageTeam: false,
          canViewReports: true,
          canManageTasks: false
        }
      });
    }
    
    await testTeam.save();
    console.log('Test team updated. Total members:', testTeam.members.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

addMembersToTestTeam();
