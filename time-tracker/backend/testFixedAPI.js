const mongoose = require('mongoose');
const TimeEntry = require('./models/TimeEntry');
const User = require('./models/User');
const Project = require('./models/Project');

require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker');

async function testFixedAPI() {
  try {
    console.log('Testing fixed API consistency...');
    
    const user = await User.findOne({ name: 'hackerone tess' });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    // Simulate the fixed getAccessibleProjects call with req.user._id
    const accessibleProjects = await Project.find({ 
      organization: user.organization, 
      isActive: true,
      $or: [
        { owner: user._id },  // Now using _id instead of id
        { 'members.user': user._id }
      ]
    }).select('_id name');
    
    console.log(`Found ${accessibleProjects.length} accessible projects for ${user.name}`);
    
    const accessibleProjectIds = accessibleProjects.map(p => p._id);
    
    // Test the timesheet query with consistent _id usage
    let matchQuery = { 
      user: user._id,
      project: { $in: accessibleProjectIds }
    };
    
    const totals = await TimeEntry.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: '$duration' },
          billableDuration: {
            $sum: {
              $cond: [{ $eq: ['$billable', true] }, '$duration', 0]
            }
          },
          totalEntries: { $sum: 1 }
        }
      }
    ]);
    
    console.log('Fixed API totals:', totals[0] || { totalDuration: 0, billableDuration: 0, totalEntries: 0 });
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

testFixedAPI();
