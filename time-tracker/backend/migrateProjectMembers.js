const mongoose = require('mongoose');
const Project = require('./models/Project');
const Team = require('./models/Team');
const Organization = require('./models/Organization');
require('dotenv').config();

const migrateProjectMembers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');    // Find all projects with members
    const projects = await Project.find({ 
      'members.0': { $exists: true },
      isActive: true 
    });

    console.log(`Found ${projects.length} projects with members to migrate`);

    for (const project of projects) {
      console.log(`\nMigrating project: ${project.name}`);
      let updated = false;

      for (const member of project.members) {
        // If member already has teamRole, skip
        if (member.teamRole) {
          console.log(`  Member ${member.user} already has teamRole: ${member.teamRole}`);
          continue;
        }

        // Find the user's team role
        const team = await Team.findOne({
          organization: project.organization,
          'members.user': member.user,
          isActive: true
        });

        if (team) {
          const teamMember = team.members.find(tm => 
            tm.user.toString() === member.user.toString()
          );

          if (teamMember) {
            // Update member with team role and permissions
            member.teamRole = teamMember.role;
            member.permissions = teamMember.permissions;
            
            // Remove old 'role' field if it exists
            if (member.role) {
              member.role = undefined;
            }
            
            updated = true;
            console.log(`  Updated member ${member.user} with team role: ${teamMember.role}`);
          } else {
            console.log(`  Warning: Member ${member.user} not found in any team`);
          }
        } else {
          console.log(`  Warning: No team found for member ${member.user}`);
        }
      }

      if (updated) {
        await project.save();
        console.log(`  Project ${project.name} saved successfully`);
      } else {
        console.log(`  No changes needed for project ${project.name}`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateProjectMembers();
