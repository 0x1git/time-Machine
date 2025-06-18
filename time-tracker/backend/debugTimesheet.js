const mongoose = require('mongoose');
const TimeEntry = require('./models/TimeEntry');
const User = require('./models/User');
const Project = require('./models/Project');

require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function debugTimesheet() {
  try {
    // Get a sample user
    const user = await User.findOne();
    if (!user) {
      console.log('❌ No users found');
      return;
    }
    console.log('👤 Testing with user:', user.name, '(', user._id, ')');

    // Get user's projects
    const projects = await Project.find({
      $or: [
        { owner: user._id },
        { 'members.user': user._id }
      ]
    });
    console.log('📁 User has access to', projects.length, 'projects');
    
    const accessibleProjectIds = projects.map(p => p._id);

    // Check if user has time entries
    const totalEntries = await TimeEntry.countDocuments({ user: user._id });
    console.log('⏱️ User has', totalEntries, 'total time entries');

    // Check entries in accessible projects
    const accessibleEntries = await TimeEntry.countDocuments({ 
      user: user._id,
      project: { $in: accessibleProjectIds }
    });
    console.log('✅ User has', accessibleEntries, 'entries in accessible projects');

    // Test the exact query used by timesheet endpoint
    const today = new Date();
    const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    let matchQuery = { 
      user: user._id,
      project: { $in: accessibleProjectIds },
      startTime: {
        $gte: threeMonthsAgo,
        $lte: today
      }
    };

    console.log('🔍 Match query:', JSON.stringify(matchQuery, null, 2));

    // Test aggregation for totals
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

    console.log('📊 Aggregation totals result:', totals);

    // Get some sample entries
    const sampleEntries = await TimeEntry.find(matchQuery)
      .populate('project', 'name color')
      .limit(5)
      .sort({ startTime: -1 });

    console.log('📝 Sample entries:');
    sampleEntries.forEach(entry => {
      console.log(`  - ${entry.startTime.toISOString().split('T')[0]}: ${entry.project?.name || 'No project'} - ${entry.duration}s`);
    });

    // Test with specific project filter
    if (projects.length > 0) {
      const firstProject = projects[0];
      console.log('\n🎯 Testing with specific project:', firstProject.name);
      
      const projectMatchQuery = {
        ...matchQuery,
        project: new mongoose.Types.ObjectId(firstProject._id)
      };

      const projectTotals = await TimeEntry.aggregate([
        { $match: projectMatchQuery },
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

      console.log('📊 Project-specific totals:', projectTotals);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

debugTimesheet();
