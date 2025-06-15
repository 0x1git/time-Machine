const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker');
    console.log('Connected to MongoDB');

    // Check if admin user exists
    let adminUser = await User.findOne({ email: 'admin@timetracker.com' });
    
    if (!adminUser) {
      // Create admin user
      adminUser = new User({
        name: 'Admin User',
        email: 'admin@timetracker.com',
        password: 'admin123', // This will be hashed by the pre-save middleware
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('Admin user created:', {
        email: adminUser.email,
        role: adminUser.role,
        permissions: adminUser.permissions
      });
    } else {
      // Update existing admin user to ensure permissions are set
      if (!adminUser.permissions || Object.keys(adminUser.permissions.toObject()).length === 0) {
        adminUser.markModified('role');
        await adminUser.save();
        console.log('Admin user permissions updated:', {
          email: adminUser.email,
          role: adminUser.role,
          permissions: adminUser.permissions
        });
      } else {
        console.log('Admin user already exists with permissions:', {
          email: adminUser.email,
          role: adminUser.role,
          hasPermissions: Object.keys(adminUser.permissions.toObject()).length > 0
        });
      }
    }

    // Update all existing users to ensure they have permissions
    const usersWithoutPermissions = await User.find({
      $or: [
        { permissions: { $exists: false } },
        { permissions: {} }
      ]
    });

    for (const user of usersWithoutPermissions) {
      user.markModified('role');
      await user.save();
      console.log(`Updated permissions for user: ${user.email} (${user.role})`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdminUser();
