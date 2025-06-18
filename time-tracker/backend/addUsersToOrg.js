const mongoose = require('mongoose');
const User = require('./models/User');
const Organization = require('./models/Organization');

require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker');

async function addUsersToOrganization() {
  try {
    console.log('Adding existing users to admin organization...');
    
    // Find admin user and organization
    const adminUser = await User.findOne({ email: 'admin@timetracker.com' });
    const organization = await Organization.findById(adminUser.organization);
    
    console.log('Admin organization:', organization.name);
    
    // Find users without organization
    const usersWithoutOrg = await User.find({ 
      organization: { $exists: false },
      email: { $ne: 'admin@timetracker.com' }
    }).limit(3);
    
    console.log('Found users without org:', usersWithoutOrg.length);
    
    for (const user of usersWithoutOrg) {
      console.log('Adding user to org:', user.name, user.email);
      
      // Add user to organization
      user.organization = organization._id;
      await user.save();
      
      // Add user to organization members
      organization.members.push({
        user: user._id,
        role: 'member',
        permissions: {
          canCreateProjects: false,
          canViewReports: true
        }
      });
    }
    
    await organization.save();
    console.log('Updated organization with', usersWithoutOrg.length, 'new members');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

addUsersToOrganization();
