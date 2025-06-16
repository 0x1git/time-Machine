const mongoose = require('mongoose');
const User = require('./models/User');
const Organization = require('./models/Organization');
const Team = require('./models/Team');
const Project = require('./models/Project');

async function debugUserProjectAccess() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/timetracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Get all organizations (find the newest)
    const orgs = await Organization.find({}).sort({ createdAt: -1 });
    console.log('\n=== ORGANIZATIONS ===');
    orgs.forEach((org, index) => {
      console.log(`${index + 1}. ${org.name} (${org._id})`);
    });

    // Focus on the newest organization
    const targetOrg = orgs[0];
    if (!targetOrg) {
      console.log('No organizations found');
      return;
    }

    console.log(`\n=== ANALYZING ORGANIZATION: ${targetOrg.name} ===`);

    // Get all users in this organization
    const users = await User.find({ organization: targetOrg._id });
    console.log(`\nUsers in organization: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    // Get teams in this organization
    const teams = await Team.find({ organization: targetOrg._id }).populate('members.user', 'name email');
    console.log(`\nTeams: ${teams.length}`);
    teams.forEach(team => {
      console.log(`\nTeam: ${team.name}`);
      console.log(`Members: ${team.members.length}`);
      team.members.forEach(member => {
        console.log(`  - ${member.user?.name} (${member.user?.email}) - Role: ${member.role}`);
      });
    });

    // Get projects in this organization
    const projects = await Project.find({ organization: targetOrg._id }).populate('owner members.user');
    console.log(`\nProjects: ${projects.length}`);
    projects.forEach(project => {
      console.log(`\nProject: ${project.name} (${project._id})`);
      console.log(`Owner: ${project.owner?.name} (${project.owner?._id})`);
      console.log(`Members: ${project.members.length}`);
      project.members.forEach(member => {
        console.log(`  - ${member.user?.name} (${member.user?._id}) - Team Role: ${member.teamRole}`);
      });
    });

    // Test access for each user
    console.log(`\n=== PROJECT ACCESS ANALYSIS ===`);
    for (const user of users) {
      console.log(`\n👤 Testing access for: ${user.name} (${user.email})`);
      
      // Check what projects this user should see (same query as frontend)
      const userProjects = await Project.find({
        organization: targetOrg._id,
        $or: [
          { owner: user._id },
          { 'members.user': user._id }
        ],
        isActive: true
      }).populate('owner', 'name').populate('members.user', 'name');

      console.log(`  Accessible projects: ${userProjects.length}`);
      if (userProjects.length === 0) {
        console.log(`  ❌ PROBLEM: User has no accessible projects`);
        
        // Check if user is in any team
        const userTeams = await Team.find({
          organization: targetOrg._id,
          'members.user': user._id
        });
        
        if (userTeams.length === 0) {
          console.log(`     - User is not a member of any team`);
        } else {
          console.log(`     - User is member of ${userTeams.length} team(s):`);
          userTeams.forEach(team => {
            console.log(`       * ${team.name}`);
          });
          console.log(`     - But user is not added to any projects`);
        }
      } else {
        userProjects.forEach(project => {
          const isOwner = project.owner._id.toString() === user._id.toString();
          const memberInfo = project.members.find(m => m.user._id.toString() === user._id.toString());
          
          console.log(`  ✅ ${project.name}`);
          console.log(`     - Owner: ${isOwner ? 'YES' : 'NO'}`);
          console.log(`     - Member: ${memberInfo ? `YES (${memberInfo.teamRole})` : 'NO'}`);
        });
      }
    }    // Check for recent invitations
    console.log(`\n=== RECENT INVITATION CHECK ===`);
    const teamsWithInvitations = await Team.find({
      organization: targetOrg._id
    }).populate('invitations.invitedBy', 'name email');

    let foundInvitations = false;
    teamsWithInvitations.forEach(team => {
      team.invitations.forEach(invitation => {
        foundInvitations = true;
        console.log(`\n📧 Invitation found:`);
        console.log(`   Email: ${invitation.email}`);
        console.log(`   Team: ${team.name}`);
        console.log(`   Role: ${invitation.role}`);
        console.log(`   Status: ${invitation.status}`);
        console.log(`   Invited by: ${invitation.invitedBy ? invitation.invitedBy.name : 'Unknown'}`);
        console.log(`   Invited at: ${invitation.invitedAt}`);
        console.log(`   Expires at: ${invitation.expiresAt}`);
        
        // If invitation is accepted, check for user with this email
        if (invitation.status === 'accepted') {
          const userWithEmail = users.find(u => u.email === invitation.email);
          if (userWithEmail) {
            const userInProjects = projects.filter(p => 
              p.owner._id.toString() === userWithEmail._id.toString() || 
              p.members.some(m => m.user._id.toString() === userWithEmail._id.toString())
            );
            console.log(`   User found: ${userWithEmail.name}`);
            console.log(`   Project access: ${userInProjects.length} projects`);
          }
        }
      });
    });  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugUserProjectAccess();
