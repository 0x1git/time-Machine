const axios = require('axios');

async function testProjectsAPI() {
  try {
    console.log('Testing projects API for invited user...');
    
    // First, login as the invited user
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'quackduckmember@guerrillamailblock.com',
      password: 'password123' // You may need to update this with the correct password
    });
    
    console.log('Login successful');
    const token = loginResponse.data.token;
    
    // Now fetch projects with the token
    const projectsResponse = await axios.get('http://localhost:5000/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`\nProjects API Response:`);
    console.log(`Status: ${projectsResponse.status}`);
    console.log(`Projects count: ${projectsResponse.data.length}`);
    console.log('Projects:', JSON.stringify(projectsResponse.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.error(`Error: ${error.response.status} - ${error.response.data.msg || error.response.data}`);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testProjectsAPI();
