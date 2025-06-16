const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Team = require('./models/Team');
const Organization = require('./models/Organization');

async function analyzeTaskCreationIssues() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/timetracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Find the Quack duck user
    const user = await User.findOne({ email: 'quackduck@guerrillamailblock.com' }).populate('organization');
    if (!user) {
      console.log('❌ PROBLEM: User not found');
      return;
    }
    
    console.log('\n=== USER ANALYSIS ===');
    console.log(`User: ${user.name} (${user.email})`);
    console.log(`Organization: ${user.organization?.name} (${user.organization?._id})`);
    console.log(`User permissions:`, user.permissions);

    // Check team membership
    const teams = await Team.find({ 
      organization: user.organization._id,
      'members.user': user._id
    }).populate('members.user');
    
    console.log('\n=== TEAM MEMBERSHIP ANALYSIS ===');
    if (teams.length === 0) {
      console.log('❌ PROBLEM: User is not a member of any team in their organization');
    } else {
      teams.forEach(team => {
        const member = team.members.find(m => m.user._id.toString() === user._id.toString());
        console.log(`✅ User is member of team: ${team.name}`);
        console.log(`   Role: ${member.role}`);
        console.log(`   Team ID: ${team._id}`);
      });
    }

    // Check available projects in user's organization
    const allProjects = await Project.find({ 
      organization: user.organization._id,
      isActive: true 
    }).populate('owner members.user');
    
    console.log('\n=== PROJECT ACCESS ANALYSIS ===');
    console.log(`Total projects in organization: ${allProjects.length}`);
    
    allProjects.forEach(project => {
      console.log(`\nProject: ${project.name} (${project._id})`);
      console.log(`  Owner: ${project.owner?.name} (${project.owner?._id})`);
      
      const isOwner = project.owner._id.toString() === user._id.toString();
      const isMember = project.members.some(member => member.user._id.toString() === user._id.toString());
      
      console.log(`  Is Owner: ${isOwner}`);
      console.log(`  Is Member: ${isMember}`);
      console.log(`  Can Create Tasks: ${isOwner || isMember ? '✅ YES' : '❌ NO'}`);
      
      if (!isOwner && !isMember) {
        console.log(`  ❌ PROBLEM: User cannot create tasks in this project - not owner or member`);
        console.log(`     To fix: Add user to project members through the project management interface`);
      }
    });

    // Check what happens during task creation flow
    console.log('\n=== TASK CREATION FLOW ANALYSIS ===');
    
    // Simulate the exact check from the task creation route
    for (const project of allProjects) {
      console.log(`\nTesting task creation access for project: ${project.name}`);
      
      // This is the exact check from routes/tasks.js line 61-67
      const projectDoc = await Project.findOne({
        _id: project._id,
        organization: user.organization._id
      });
      
      if (!projectDoc) {
        console.log(`❌ Project not found in organization check`);
        continue;
      }
      
      const hasAccess = projectDoc.owner.toString() === user._id.toString() ||
                       projectDoc.members.some(member => member.user.toString() === user._id.toString());
      
      console.log(`  Organization check: ✅ PASS`);
      console.log(`  Access check: ${hasAccess ? '✅ PASS' : '❌ FAIL'}`);
      
      if (!hasAccess) {
        console.log(`  ❌ PROBLEM: Access denied - user is neither owner nor member`);
        console.log(`     Owner ID: ${projectDoc.owner}`);
        console.log(`     User ID: ${user._id}`);
        console.log(`     Members: ${projectDoc.members.map(m => m.user).join(', ')}`);
      }
    }

    // Check if user can see projects in the frontend
    console.log('\n=== FRONTEND PROJECT VISIBILITY ===');
    const userProjects = await Project.find({
      organization: user.organization._id,
      $or: [
        { owner: user._id },
        { 'members.user': user._id }
      ],
      isActive: true
    });
    
    console.log(`Projects visible to user: ${userProjects.length}`);
    if (userProjects.length === 0) {
      console.log(`❌ PROBLEM: User has no accessible projects to create tasks in`);
      console.log(`   Solution: User needs to be added to at least one project as a member`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

analyzeTaskCreationIssues();
