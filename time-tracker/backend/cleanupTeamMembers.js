const mongoose = require('mongoose');
const Team = require('./models/Team');
const User = require('./models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/time-tracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const cleanupTeamMembers = async () => {
  try {
    await connectDB();

    console.log('Checking for teams with invalid user references...');

    // Find all teams
    const teams = await Team.find().populate('members.user', 'name email');
    
    console.log(`Found ${teams.length} teams`);

    let cleanupCount = 0;

    for (const team of teams) {
      const validMembers = [];
      const invalidMembers = [];

      for (const member of team.members) {
        if (member.user && member.user._id) {
          validMembers.push(member);
        } else {
          invalidMembers.push(member);
        }
      }

      if (invalidMembers.length > 0) {
        console.log(`\nTeam "${team.name}" has ${invalidMembers.length} invalid member(s):`);
        invalidMembers.forEach((member, index) => {
          console.log(`  ${index + 1}. Member with user ID: ${member.user || 'null'} (role: ${member.role})`);
        });

        // Update the team to only include valid members
        team.members = validMembers;
        await team.save();
        cleanupCount++;
        
        console.log(`  ✅ Cleaned up team "${team.name}" - removed ${invalidMembers.length} invalid member(s)`);
      } else {
        console.log(`✅ Team "${team.name}" has ${validMembers.length} valid member(s)`);
      }
    }

    if (cleanupCount > 0) {
      console.log(`\n🔧 Cleanup completed! Updated ${cleanupCount} team(s).`);
    } else {
      console.log('\n✅ All teams are clean - no invalid member references found.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

cleanupTeamMembers();
