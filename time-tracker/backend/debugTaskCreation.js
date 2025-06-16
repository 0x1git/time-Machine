const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Organization = require('./models/Organization');
const Team = require('./models/Team');

async function debugTaskCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/timetracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Get all organizations
    const orgs = await Organization.find({});
    console.log('\n=== ORGANIZATIONS ===');
    orgs.forEach(org => {
      console.log(`${org.name} (${org._id})`);
    });

    // Get all users
    const users = await User.find({}).populate('organization');
    console.log('\n=== USERS ===');
    users.forEach(user => {
      console.log(`${user.name} (${user.email}) - Org: ${user.organization?.name || 'None'} (${user.organization?._id || 'None'})`);
    });

    // Get all teams
    const teams = await Team.find({}).populate('organization members.user');
    console.log('\n=== TEAMS ===');
    teams.forEach(team => {
      console.log(`\nTeam: ${team.name} (${team._id})`);
      console.log(`  Organization: ${team.organization?.name || 'None'} (${team.organization?._id || 'None'})`);
      console.log(`  Members:`);
      team.members.forEach(member => {
        console.log(`    - ${member.user?.name || 'Unknown'} (${member.user?._id || 'None'}) - Role: ${member.role || 'None'}`);
      });
    });

    // Get all projects
    const projects = await Project.find({}).populate('organization owner members.user');
    console.log('\n=== PROJECTS ===');
    projects.forEach(project => {
      console.log(`\nProject: ${project.name} (${project._id})`);
      console.log(`  Organization: ${project.organization?.name || 'None'} (${project.organization?._id || 'None'})`);
      console.log(`  Owner: ${project.owner?.name || 'None'} (${project.owner?._id || 'None'})`);
      console.log(`  Members:`);
      project.members.forEach(member => {
        console.log(`    - ${member.user?.name || 'Unknown'} (${member.user?._id || 'None'}) - Role: ${member.teamRole || 'None'}`);
      });
    });    // Test access for all users
    console.log('\n=== ACCESS TEST FOR ALL USERS ===');
    for (const testUser of users) {
      console.log(`\nTesting access for user: ${testUser.name} (${testUser.email})`);
      console.log(`User's organization: ${testUser.organization?._id}`);
      
      const accessibleProjects = await Project.find({
        organization: testUser.organization?._id,
        $or: [
          { owner: testUser._id },
          { 'members.user': testUser._id }
        ],
        isActive: true
      });
      
      console.log(`Accessible projects: ${accessibleProjects.length}`);
      accessibleProjects.forEach(project => {
        console.log(`  - ${project.name} (${project._id})`);
        
        const hasAccess = project.owner.toString() === testUser._id.toString() ||
                         project.members.some(member => member.user.toString() === testUser._id.toString());
        console.log(`    Has access: ${hasAccess}`);
        console.log(`    Is owner: ${project.owner.toString() === testUser._id.toString()}`);
        console.log(`    Is member: ${project.members.some(member => member.user.toString() === testUser._id.toString())}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugTaskCreation();
