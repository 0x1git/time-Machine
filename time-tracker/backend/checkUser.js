const mongoose = require('mongoose');
const User = require('./models/User');
const Organization = require('./models/Organization');
require('dotenv').config();

const checkUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker');
    console.log('Connected to MongoDB');

    // Get all users and their organization status
    const users = await User.find({}).populate('organization');
    
    console.log('\nUser Organization Status:');
    console.log('=========================');
    
    for (const user of users) {
      console.log(`User: ${user.email} (${user._id})`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Organization ID: ${user.organization ? user.organization._id : 'NULL'}`);
      console.log(`  Organization Name: ${user.organization ? user.organization.name : 'NO ORGANIZATION'}`);
      console.log(`  IsActive: ${user.isActive}`);
      console.log('  ---');
    }

    // Check for users without organizations
    const usersWithoutOrg = await User.find({
      $or: [
        { organization: { $exists: false } },
        { organization: null }
      ]
    });

    console.log(`\nUsers without organization: ${usersWithoutOrg.length}`);
    
    // Check for orphaned organization references
    const usersWithInvalidOrg = [];
    for (const user of users) {
      if (user.organization === null || user.organization === undefined) {
        usersWithInvalidOrg.push(user);
      }
    }
    
    console.log(`Users with invalid org references: ${usersWithInvalidOrg.length}`);

    // List all organizations
    const orgs = await Organization.find({});
    console.log('\nAll Organizations:');
    console.log('==================');
    for (const org of orgs) {
      console.log(`${org.name} (${org._id}) - Created by: ${org.createdBy}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkUsers();
