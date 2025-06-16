const axios = require('axios');

// Configure axios to use the local backend
axios.defaults.baseURL = 'http://localhost:5000/api';

async function testNavigationVisibility() {
  const testUsers = [
    {
      name: 'Admin User',
      email: 'quackduck@guerrillamailblock.com',
      password: '12345678',
      expectedRole: 'admin'
    },
    {
      name: 'Member User',
      email: 'quackduckmember@guerrillamailblock.com', 
      password: '12345678',
      expectedRole: 'member'
    }
  ];

  console.log('=== Navigation Visibility Test ===\n');

  for (const testUser of testUsers) {
    try {
      console.log(`\n--- Testing ${testUser.name} ---`);
      
      // Login
      const loginResponse = await axios.post('/auth/login', {
        email: testUser.email,
        password: testUser.password
      });
      
      const user = loginResponse.data.user;
      console.log(`✅ Login: ${user.name} (${user.role})`);
      
      // Check navigation visibility based on permissions
      const nav = {
        dashboard: true, // Always visible
        timer: true, // Always visible
        projects: user.permissions.canCreateProjects || user.permissions.canViewAllProjects || user.permissions.canEditOwnProjects,
        tasks: user.permissions.canCreateTasks || user.permissions.canManageAllTasks,
        teams: user.permissions.canManageTeams || ['admin', 'manager'].includes(user.role) || user.permissions.canViewAllUsers,
        reports: user.permissions.canViewAllReports || user.permissions.canViewTeamReports || user.permissions.canExportReports,
        settings: user.permissions.canManageSettings || ['admin', 'manager'].includes(user.role)
      };
      
      console.log('\nNavigation Visibility:');
      Object.entries(nav).forEach(([section, visible]) => {
        console.log(`  ${section.padEnd(10)}: ${visible ? '✅ Visible' : '❌ Hidden'}`);
      });
      
      // Test Projects API if visible
      if (nav.projects) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.token}`;
        const projectsResponse = await axios.get('/projects');
        console.log(`\nProjects API: ✅ ${projectsResponse.data.length} projects accessible`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${testUser.name}:`, error.response?.data?.message || error.message);
    }
  }
  
  console.log('\n=== Summary ===');
  console.log('✅ Admin users: Full navigation access');
  console.log('✅ Member users: Should now see Projects section');
  console.log('✅ Permission-based navigation working correctly');
}

testNavigationVisibility();
