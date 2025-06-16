const mongoose = require('mongoose');
const Team = require('./models/Team');
const User = require('./models/User');

async function getLatestInvitation() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/timetracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Find teams with pending invitations
    const teams = await Team.find({
      'invitations.status': 'pending'
    }).populate('invitations.invitedBy', 'name email');

    if (teams.length === 0) {
      console.log('No pending invitations found');
      return;
    }

    console.log('\n=== PENDING INVITATIONS ===');
    teams.forEach(team => {
      console.log(`\nTeam: ${team.name}`);
      team.invitations.forEach(invitation => {
        if (invitation.status === 'pending') {
          console.log(`\n📧 Invitation Details:`);
          console.log(`   Email: ${invitation.email}`);
          console.log(`   Role: ${invitation.role}`);
          console.log(`   Invited by: ${invitation.invitedBy?.name || 'Unknown'}`);
          console.log(`   Created: ${invitation.createdAt}`);
          console.log(`   Token: ${invitation.token}`);
          console.log(`\n🔗 INVITATION LINK:`);
          console.log(`   ${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invitation/${invitation.token}`);
          console.log(`\n📋 Share this link with the invitee: ${invitation.email}`);
          console.log(`─────────────────────────────────────────────────────────────`);
        }
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

getLatestInvitation();
