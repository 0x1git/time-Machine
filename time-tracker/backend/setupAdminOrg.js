const mongoose = require('mongoose');
const User = require('./models/User');
const Organization = require('./models/Organization');

require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker');

async function setupAdminWithOrganization() {
  try {
    console.log('Setting up admin user with organization...');
    
    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@timetracker.com' });
    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }
    
    console.log('Found admin user:', adminUser.name);
    
    // Check if admin already has an organization
    if (adminUser.organization) {
      console.log('Admin already has organization:', adminUser.organization);
      const org = await Organization.findById(adminUser.organization);
      console.log('Organization details:', org?.name);
      return;
    }
    
    // Find or create an organization
    let organization = await Organization.findOne({ name: 'Default Organization' });
    
    if (!organization) {
      organization = new Organization({
        name: 'Default Organization',
        description: 'Default organization for admin user',
        owner: adminUser._id,
        members: [{
          user: adminUser._id,
          role: 'admin',
          permissions: {
            canManageUsers: true,
            canViewAllUsers: true,
            canManageAllProjects: true,
            canCreateProjects: true,
            canManageTeams: true,
            canViewTeamReports: true
          }
        }]
      });
      await organization.save();
      console.log('Created new organization:', organization.name);
    }
    
    // Associate admin with organization
    adminUser.organization = organization._id;
    await adminUser.save();
    
    console.log('Admin user updated with organization');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

setupAdminWithOrganization();
