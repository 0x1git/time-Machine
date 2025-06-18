const axios = require('axios');

axios.defaults.baseURL = 'http://localhost:5000/api';

const testAssignedTasks = async () => {
  try {
    console.log('Testing assigned tasks functionality...\n');

    // First, login as admin user
    const loginResponse = await axios.post('/auth/login', {
      email: 'admin@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');

    // Set auth header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Get the admin user info
    const userResponse = await axios.get('/users/me');
    const adminUser = userResponse.data;
    console.log(`✅ Admin user: ${adminUser.name} (${adminUser._id})`);

    // Get all tasks
    const tasksResponse = await axios.get('/tasks');
    console.log(`✅ Found ${tasksResponse.data.length} total tasks`);

    // Check for tasks assigned to admin
    const assignedToAdmin = tasksResponse.data.filter(task => 
      task.assignees && task.assignees.some(assignee => assignee._id === adminUser._id)
    );
    console.log(`✅ Tasks assigned to admin: ${assignedToAdmin.length}`);

    if (assignedToAdmin.length > 0) {
      console.log('\n📋 Assigned tasks:');
      assignedToAdmin.forEach((task, index) => {
        console.log(`${index + 1}. ${task.title || task.name}`);
        console.log(`   Project: ${task.project?.name || 'No project'}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Assignees: ${task.assignees.map(a => a.name).join(', ')}`);
        console.log('');
      });
    }

    // Test the specific API call that dashboard makes
    const dashboardTasksResponse = await axios.get(`/tasks?assignee=${adminUser._id}`);
    console.log(`✅ Dashboard API call result: ${dashboardTasksResponse.data.length} tasks`);

    if (dashboardTasksResponse.data.length > 0) {
      console.log('\n📊 Tasks from dashboard API:');
      dashboardTasksResponse.data.forEach((task, index) => {
        console.log(`${index + 1}. ${task.title || task.name} (${task.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

testAssignedTasks();
