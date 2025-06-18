const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker');

async function checkAllUsers() {
  try {
    const users = await User.find({}).select('_id name email organization');
    console.log('All users in database:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user._id}, Name: ${user.name}, Email: ${user.email}, Org: ${user.organization}`);
    });

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

checkAllUsers();
