const mongoose = require('mongoose');
const User = require('./models/User');
const Organization = require('./models/Organization');
require('dotenv').config();

const fixUserOrganizations = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker');
    console.log('Connected to MongoDB');

    // Find the default organization
    let defaultOrg = await Organization.findOne({ name: 'Default Organization' });
    
    if (!defaultOrg) {
      console.log('Default organization not found, creating one...');
      const adminUser = await User.findOne({ role: 'admin' });
      defaultOrg = new Organization({
        name: 'Default Organization',
        slug: 'default-org',
        description: 'Default organization for existing users',
        createdBy: adminUser ? adminUser._id : null
      });
      await defaultOrg.save();
      console.log('Created default organization');
    }

    console.log(`Using default organization: ${defaultOrg.name} (${defaultOrg._id})`);

    // Get all users with invalid organization references
    const users = await User.find({}).populate('organization');
    
    let fixedCount = 0;
    for (const user of users) {
      if (!user.organization) {
        console.log(`Fixing user: ${user.email} (${user._id})`);
        user.organization = defaultOrg._id;
        await user.save();
        fixedCount++;
      }
    }

    console.log(`Fixed ${fixedCount} users with invalid organization references`);

    // Verify the fix
    console.log('\nVerification - User Organization Status:');
    console.log('========================================');
    
    const verifyUsers = await User.find({}).populate('organization');
    for (const user of verifyUsers) {
      console.log(`User: ${user.email}`);
      console.log(`  Organization: ${user.organization ? user.organization.name : 'NO ORGANIZATION'}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixUserOrganizations();
