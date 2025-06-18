const axios = require('axios');

axios.defaults.baseURL = 'http://localhost:5000/api';

const checkUsers = async () => {
  try {
    console.log('Checking available users...\n');

    // Try different admin credentials
    const possibleCredentials = [
      { email: 'admin@example.com', password: 'password123' },
      { email: 'admin@timetracker.com', password: 'admin123' },
      { email: 'admin@admin.com', password: 'admin' },
      { email: 'test@example.com', password: 'password123' }
    ];

    for (const creds of possibleCredentials) {
      try {
        console.log(`Trying: ${creds.email} / ${creds.password}`);
        const loginResponse = await axios.post('/auth/login', creds);
        
        if (loginResponse.data.token) {
          console.log(`✅ SUCCESS with ${creds.email}`);
          
          // Set auth header and get user info
          axios.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.token}`;
          const userResponse = await axios.get('/users/me');
          const user = userResponse.data;
          console.log(`User: ${user.name} (${user._id})`);
          console.log(`Organization: ${user.organization ? user.organization._id : 'None'}\n`);
          
          // Get tasks for this user
          const tasksResponse = await axios.get('/tasks');
          console.log(`Total tasks accessible: ${tasksResponse.data.length}`);
          
          const assignedTasks = tasksResponse.data.filter(task => 
            task.assignees && task.assignees.some(assignee => assignee._id === user._id)
          );
          console.log(`Tasks assigned to this user: ${assignedTasks.length}`);
          
          if (assignedTasks.length > 0) {
            assignedTasks.forEach(task => {
              console.log(`- ${task.title || task.name} (${task.status})`);
            });
          }
          
          return; // Exit after first successful login
        }
      } catch (error) {
        console.log(`❌ Failed: ${error.response?.data?.message || error.message}`);
      }
    }
    
    console.log('\n❌ No valid credentials found. You may need to register a new user.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

checkUsers();
