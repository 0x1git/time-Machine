const mongoose = require('mongoose');
const User = require('./models/User');
const Organization = require('./models/Organization');
const Team = require('./models/Team');

async function debugNewOrgIssue() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/timetracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Get all organizations (focusing on recently created ones)
    const orgs = await Organization.find({}).sort({ createdAt: -1 });
    console.log('\n=== ORGANIZATIONS (Latest First) ===');
    orgs.forEach((org, index) => {
      console.log(`${index + 1}. ${org.name} (${org._id}) - Created: ${org.createdAt}`);
    });

    // Find users in the newest organization
    const newestOrg = orgs[0];
    if (newestOrg) {
      console.log(`\n=== CHECKING NEWEST ORGANIZATION: ${newestOrg.name} ===`);
      
      const usersInOrg = await User.find({ organization: newestOrg._id });
      console.log(`\nUsers in organization: ${usersInOrg.length}`);
      usersInOrg.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
      });

      // Check teams in this organization
      const teamsInOrg = await Team.find({ organization: newestOrg._id }).populate('members.user', 'name email');
      console.log(`\nTeams in organization: ${teamsInOrg.length}`);
      teamsInOrg.forEach(team => {
        console.log(`\nTeam: ${team.name} (${team._id})`);
        console.log(`Members: ${team.members.length}`);
        team.members.forEach(member => {
          console.log(`  - ${member.user.name} (${member.user.email}) - Role: ${member.role}`);
        });
      });

      // Check if admin user is in any team
      const adminUser = usersInOrg.find(user => user.role === 'admin');
      if (adminUser) {
        console.log(`\n=== ADMIN USER TEAM MEMBERSHIP CHECK ===`);
        console.log(`Admin User: ${adminUser.name} (${adminUser.email})`);
        
        const adminTeams = await Team.find({
          organization: newestOrg._id,
          'members.user': adminUser._id
        });
        
        console.log(`Admin is member of ${adminTeams.length} teams`);
        if (adminTeams.length === 0) {
          console.log('❌ PROBLEM: Admin user is not a member of any team!');
          console.log('   This will cause project creation to fail.');
          console.log('   Solution: Create a team and add the admin user to it.');
        } else {
          adminTeams.forEach(team => {
            const memberInfo = team.members.find(m => m.user.toString() === adminUser._id.toString());
            console.log(`✅ Admin is member of team: ${team.name} with role: ${memberInfo.role}`);
          });
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugNewOrgIssue();
