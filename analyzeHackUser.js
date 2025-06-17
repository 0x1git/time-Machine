const mongoose = require('mongoose');
const TimeEntry = require('./models/TimeEntry');
const User = require('./models/User');
const Project = require('./models/Project');

require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker');

async function analyzeHackeroneUser() {
  try {
    console.log('Analyzing hackerone tess user...');
    
    // Find the hackerone tess user
    const user = await User.findOne({ name: 'hackerone tess' });
    if (!user) {
      console.log('hackerone tess user not found');
      return;
    }
    
    console.log(`User: ${user.name} (${user._id})`);
    console.log(`User organization: ${user.organization}`);
    
    // Find all time entries for this user
    const allUserEntries = await TimeEntry.find({ user: user._id })
      .populate('project', 'name organization owner members isActive')
      .populate('user', 'name organization');
    
    console.log(`\nTotal time entries for ${user.name}: ${allUserEntries.length}`);
    
    if (allUserEntries.length > 0) {
      let totalDuration = 0;
      allUserEntries.forEach((entry, index) => {
        totalDuration += entry.duration;
        console.log(`  Entry ${index + 1}: ${entry.duration}s in project "${entry.project?.name}" (${entry.project?._id})`);
        console.log(`    Project org: ${entry.project?.organization}`);
        console.log(`    Project active: ${entry.project?.isActive}`);
        console.log(`    User org matches project org: ${user.organization?.toString() === entry.project?.organization?.toString()}`);
      });
      
      console.log(`Total duration: ${totalDuration}s (${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m)`);
    }
    
    // Test the accessible projects logic for this user
    console.log('\n--- Testing accessible projects logic ---');
    
    const accessibleProjects = await Project.find({ 
      organization: user.organization, 
      isActive: true,
      $or: [
        { owner: user._id },
        { 'members.user': user._id }
      ]
    }).select('_id name owner members');
    
    console.log(`Accessible projects for ${user.name}: ${accessibleProjects.length}`);
    accessibleProjects.forEach(p => {
      console.log(`  - ${p.name} (${p._id})`);
      console.log(`    Owner: ${p.owner}`);
      console.log(`    User is owner: ${p.owner?.toString() === user._id.toString()}`);
      console.log(`    User in members: ${p.members?.some(m => m.user?.toString() === user._id.toString())}`);
    });
    
    // Test the timesheet query that reports use
    const accessibleProjectIds = accessibleProjects.map(p => p._id);
    let matchQuery = { 
      user: user._id,
      project: { $in: accessibleProjectIds }
    };
    
    console.log('\n--- Testing reports timesheet query ---');
    console.log('Match query:', JSON.stringify(matchQuery, null, 2));
    
    const filteredEntries = await TimeEntry.find(matchQuery)
      .populate('project', 'name');
    
    console.log(`Filtered entries for reports: ${filteredEntries.length}`);
    
    // Calculate totals like in the reports API
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
    
    console.log('Reports totals:', totals[0] || { totalDuration: 0, billableDuration: 0, totalEntries: 0 });
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

analyzeHackeroneUser();
