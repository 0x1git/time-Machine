const mongoose = require('mongoose');
require('dotenv').config();

const TimeEntry = require('./models/TimeEntry');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');

async function testTimesheetAggregation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker');
    console.log('Connected to MongoDB');
    
    // Find the user
    const user = await User.findOne({ name: 'hackerone tess' });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User:', user.name, '(', user._id, ')');
    console.log('User org:', user.organization);
    
    // Get accessible projects (replicating the getAccessibleProjects function)
    let query = { organization: user.organization, isActive: true };
    
    // Check if user has permissions (for now assume they don't have canViewAllProjects)
    // Regular users only see projects they own or are members of
    query = {
      ...query,
      $or: [
        { owner: user._id },
        { 'members.user': user._id }
      ]
    };
    
    const accessibleProjects = await Project.find(query).select('_id name');
    const accessibleProjectIds = accessibleProjects.map(p => p._id);
    
    console.log('\nAccessible projects:', accessibleProjects.length);
    accessibleProjects.forEach(p => console.log('  -', p.name, '(', p._id, ')'));
    
    // Test the exact aggregation used in timesheet endpoint
    let matchQuery = { 
      user: user._id,
      project: { $in: accessibleProjectIds }
    };
    
    console.log('\nMatch query:', JSON.stringify(matchQuery, null, 2));
    
    // Run the exact aggregation from timesheet endpoint
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
    
    console.log('\n=== TIMESHEET AGGREGATION RESULT ===');
    console.log('Aggregation result:', totals[0] || { totalDuration: 0, billableDuration: 0, totalEntries: 0 });
    
    // Also test direct find to compare
    const directEntries = await TimeEntry.find(matchQuery);
    console.log('\n=== DIRECT FIND RESULT ===');
    console.log('Direct find entries:', directEntries.length);
    
    if (directEntries.length > 0) {
      const manualTotal = directEntries.reduce((sum, entry) => sum + entry.duration, 0);
      console.log('Manual total duration:', manualTotal);
    }
    
    // Let's also check the ObjectId conversion issue
    console.log('\n=== ID COMPARISON ===');
    console.log('User ID type:', typeof user._id);
    console.log('User ID string:', user._id.toString());
    console.log('AccessibleProjectIds:', accessibleProjectIds.map(id => ({ type: typeof id, value: id.toString() })));
    
    // Test with string conversion
    const matchQueryStringIds = { 
      user: user._id,
      project: { $in: accessibleProjectIds.map(id => id.toString()) }
    };
    
    console.log('\nMatch query with string IDs:', JSON.stringify(matchQueryStringIds, null, 2));
    
    const totalsString = await TimeEntry.aggregate([
      { $match: matchQueryStringIds },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: '$duration' },
          totalEntries: { $sum: 1 }
        }
      }
    ]);
    
    console.log('String IDs aggregation result:', totalsString[0] || { totalDuration: 0, totalEntries: 0 });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testTimesheetAggregation();
