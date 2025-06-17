const mongoose = require('mongoose');
const TimeEntry = require('./models/TimeEntry');
const User = require('./models/User');
const Project = require('./models/Project');

// Connect to MongoDB
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker');

async function checkTimeEntries() {
  try {
    console.log('Checking time entries in database...');
    
    const totalEntries = await TimeEntry.countDocuments();
    console.log(`Total time entries: ${totalEntries}`);
    
    if (totalEntries > 0) {
      const sampleEntries = await TimeEntry.find()
        .populate('user', 'name email')
        .populate('project', 'name')
        .limit(3);
      
      console.log('Sample time entries:');
      sampleEntries.forEach((entry, index) => {
        console.log(`${index + 1}. User: ${entry.user?.name || 'Unknown'}, Project: ${entry.project?.name || 'Unknown'}, Duration: ${entry.duration}s (${Math.floor(entry.duration / 3600)}h ${Math.floor((entry.duration % 3600) / 60)}m)`);
      });
      
      // Test aggregation like in reports
      const testAggregation = await TimeEntry.aggregate([
        {
          $group: {
            _id: null,
            totalDuration: { $sum: '$duration' },
            totalEntries: { $sum: 1 }
          }
        }
      ]);
      
      console.log('Aggregation result:', testAggregation[0] || { totalDuration: 0, totalEntries: 0 });
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

checkTimeEntries();
