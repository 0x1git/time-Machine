const mongoose = require('mongoose');
const User = require('./models/User');
const Organization = require('./models/Organization');
const Project = require('./models/Project');
const Task = require('./models/Task');
const TimeEntry = require('./models/TimeEntry');
const Break = require('./models/Break');
const Team = require('./models/Team');
require('dotenv').config();

const migrateToOrganizationStructure = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker');
    console.log('Connected to MongoDB');

    // Create a default organization for existing users
    const defaultOrg = new Organization({
      name: 'Default Organization',
      slug: 'default-org',
      description: 'Default organization for existing users',
      createdBy: null
    });

    // Find the first admin user to be the creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      defaultOrg.createdBy = adminUser._id;
    }

    await defaultOrg.save();
    console.log('Created default organization:', defaultOrg.name);

    // Update all users to belong to the default organization
    const usersWithoutOrg = await User.find({ 
      $or: [
        { organization: { $exists: false } },
        { organization: null }
      ]
    });

    for (const user of usersWithoutOrg) {
      user.organization = defaultOrg._id;
      await user.save();
      console.log(`Updated user ${user.email} to belong to default organization`);
    }

    // Update all projects to belong to the default organization
    const projectsWithoutOrg = await Project.find({
      $or: [
        { organization: { $exists: false } },
        { organization: null }
      ]
    });

    for (const project of projectsWithoutOrg) {
      project.organization = defaultOrg._id;
      await project.save();
      console.log(`Updated project ${project.name} to belong to default organization`);
    }

    // Update all tasks to belong to the default organization
    const tasksWithoutOrg = await Task.find({
      $or: [
        { organization: { $exists: false } },
        { organization: null }
      ]
    });

    for (const task of tasksWithoutOrg) {
      task.organization = defaultOrg._id;
      await task.save();
      console.log(`Updated task ${task.name} to belong to default organization`);
    }

    // Update all time entries to belong to the default organization
    const timeEntriesWithoutOrg = await TimeEntry.find({
      $or: [
        { organization: { $exists: false } },
        { organization: null }
      ]
    });

    for (const entry of timeEntriesWithoutOrg) {
      entry.organization = defaultOrg._id;
      await entry.save();
      console.log(`Updated time entry ${entry._id} to belong to default organization`);
    }

    // Update all breaks to belong to the default organization
    const breaksWithoutOrg = await Break.find({
      $or: [
        { organization: { $exists: false } },
        { organization: null }
      ]
    });

    for (const breakEntry of breaksWithoutOrg) {
      breakEntry.organization = defaultOrg._id;
      await breakEntry.save();
      console.log(`Updated break ${breakEntry._id} to belong to default organization`);
    }

    // Update all teams to belong to the default organization
    const teamsWithoutOrg = await Team.find({
      $or: [
        { organization: { $exists: false } },
        { organization: null }
      ]
    });

    for (const team of teamsWithoutOrg) {
      team.organization = defaultOrg._id;
      await team.save();
      console.log(`Updated team ${team.name} to belong to default organization`);
    }

    console.log('\nMigration completed successfully!');
    console.log('Summary:');
    console.log(`- Users updated: ${usersWithoutOrg.length}`);
    console.log(`- Projects updated: ${projectsWithoutOrg.length}`);
    console.log(`- Tasks updated: ${tasksWithoutOrg.length}`);
    console.log(`- Time entries updated: ${timeEntriesWithoutOrg.length}`);
    console.log(`- Breaks updated: ${breaksWithoutOrg.length}`);
    console.log(`- Teams updated: ${teamsWithoutOrg.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateToOrganizationStructure();
