const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Team = require('./models/Team');

async function addUserToProject() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/timetracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Find the Quack duck user
    const user = await User.findOne({ email: 'quackduck@guerrillamailblock.com' });
    if (!user) {
      console.log('User not found');
      return;
    }
    console.log(`Found user: ${user.name} (${user._id})`);

    // Find the team to get their role
    const team = await Team.findOne({ 
      organization: user.organization,
      'members.user': user._id
    });
    
    if (!team) {
      console.log('User is not a member of any team');
      return;
    }
    
    const teamMember = team.members.find(member => member.user.toString() === user._id.toString());
    const userRole = teamMember ? teamMember.role : 'member';
    console.log(`User role in team: ${userRole}`);

    // Find the GCOEJ project
    const project = await Project.findOne({ 
      name: 'GCOEJ Project',
      organization: user.organization 
    });
    
    if (!project) {
      console.log('Project not found');
      return;
    }
    console.log(`Found project: ${project.name} (${project._id})`);

    // Check if user is already a member
    const isAlreadyMember = project.members.some(member => 
      member.user.toString() === user._id.toString()
    );

    if (isAlreadyMember) {
      console.log('User is already a member of this project');
      return;
    }

    // Add user to project with their team role
    project.members.push({
      user: user._id,
      teamRole: userRole,
      permissions: {
        canEdit: userRole === 'admin' || userRole === 'manager',
        canDelete: userRole === 'admin'
      }
    });

    await project.save();
    console.log(`Successfully added ${user.name} to ${project.name} with role ${userRole}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

addUserToProject();
