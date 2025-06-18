const axios = require('axios');

axios.defaults.baseURL = 'http://localhost:5000/api';

const createAndAssignTask = async () => {
  try {
    console.log('Creating and assigning a task...\n');

    // Login as admin
    const loginResponse = await axios.post('/auth/login', {
      email: 'admin@timetracker.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Get user info
    const userResponse = await axios.get('/users/me');
    const adminUser = userResponse.data;
    console.log(`✅ Logged in as: ${adminUser.name} (${adminUser._id})`);

    // Get available projects
    const projectsResponse = await axios.get('/projects');
    console.log(`✅ Found ${projectsResponse.data.length} projects`);

    if (projectsResponse.data.length === 0) {
      console.log('❌ No projects found. Creating a test project...');
      
      // Create a test project
      const newProject = await axios.post('/projects', {
        name: 'Test Project',
        description: 'A test project for task assignment',
        color: '#3498db'
      });
      
      console.log(`✅ Created project: ${newProject.data.name} (${newProject.data._id})`);
      projectsResponse.data.push(newProject.data);
    }

    const project = projectsResponse.data[0];
    console.log(`✅ Using project: ${project.name} (${project._id})`);

    // Get team members to assign tasks to
    const teamsResponse = await axios.get('/teams');
    console.log(`✅ Found ${teamsResponse.data.length} teams`);

    let teamMembers = [];
    if (teamsResponse.data.length > 0) {
      const team = teamsResponse.data[0];
      teamMembers = team.members.map(m => m.user);
      console.log(`✅ Team members: ${teamMembers.length}`);
    }

    // Include admin user in assignees
    const assignees = [adminUser._id];
    if (teamMembers.length > 0) {
      assignees.push(...teamMembers.slice(0, 2).map(m => m._id));
    }

    console.log(`✅ Will assign to ${assignees.length} users`);

    // Create a test task with assignees
    const taskData = {
      name: 'Test Assigned Task',
      title: 'Test Assigned Task',
      description: 'This is a test task to verify assignment functionality',
      project: project._id,
      assignees: assignees,
      status: 'pending',
      priority: 'medium'
    };

    const taskResponse = await axios.post('/tasks', taskData);
    console.log(`✅ Created task: ${taskResponse.data.title || taskResponse.data.name} (${taskResponse.data._id})`);
    console.log(`✅ Assigned to ${taskResponse.data.assignees.length} users`);

    // Verify the task appears in assigned tasks
    console.log('\n🔍 Checking assigned tasks...');
    const assignedTasksResponse = await axios.get(`/tasks?assignee=${adminUser._id}`);
    console.log(`✅ Dashboard API returns ${assignedTasksResponse.data.length} assigned tasks`);

    // Get all tasks to double-check
    const allTasksResponse = await axios.get('/tasks');
    const userAssignedTasks = allTasksResponse.data.filter(task => 
      task.assignees && task.assignees.some(assignee => assignee._id === adminUser._id)
    );
    console.log(`✅ Manual filter shows ${userAssignedTasks.length} assigned tasks`);

    if (userAssignedTasks.length > 0) {
      console.log('\n📋 Assigned tasks details:');
      userAssignedTasks.forEach((task, index) => {
        console.log(`${index + 1}. ${task.title || task.name}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Assignees: ${task.assignees.map(a => a.name || a._id).join(', ')}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

createAndAssignTask();
