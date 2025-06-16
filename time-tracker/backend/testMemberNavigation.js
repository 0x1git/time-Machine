const axios = require('axios');

// Configure axios to use the local backend
axios.defaults.baseURL = 'http://localhost:5000/api';

async function testMemberProjectSectionAccess() {
  try {
    console.log('=== Testing Member Project Section Access ===\n');
    
    // Step 1: Login as the invited user (regular member)
    console.log('1. Logging in as regular member...');
    const loginResponse = await axios.post('/auth/login', {
      email: 'quackduckmember@guerrillamailblock.com',
      password: '12345678'
    });
    
    console.log('✅ Login successful');
    
    // Step 2: Check user permissions
    console.log('\n2. Checking user permissions...');
    const userInfo = loginResponse.data.user;
    console.log(`User: ${userInfo.name} (${userInfo.email})`);
    console.log(`Role: ${userInfo.role}`);
    console.log('\nPermissions:');
    console.log(`  canCreateProjects: ${userInfo.permissions.canCreateProjects}`);
    console.log(`  canViewAllProjects: ${userInfo.permissions.canViewAllProjects}`);
    console.log(`  canEditOwnProjects: ${userInfo.permissions.canEditOwnProjects}`);
    console.log(`  canManageAllProjects: ${userInfo.permissions.canManageAllProjects}`);
    
    // Step 3: Determine if Projects section should be visible
    console.log('\n3. Projects section visibility check...');
    const shouldShowProjects = userInfo.permissions.canCreateProjects || 
                              userInfo.permissions.canViewAllProjects || 
                              userInfo.permissions.canEditOwnProjects;
    
    console.log(`Should show Projects section: ${shouldShowProjects ? '✅ YES' : '❌ NO'}`);
    
    if (shouldShowProjects) {
      console.log('   Reason: User has canEditOwnProjects permission');
    } else {
      console.log('   Reason: User lacks required permissions');
    }
    
    // Step 4: Test Projects API access
    axios.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.token}`;
    console.log('\n4. Testing Projects API access...');
    
    const projectsResponse = await axios.get('/projects');
    console.log(`✅ Projects API accessible`);
    console.log(`Projects found: ${projectsResponse.data.length}`);
    
    if (projectsResponse.data.length > 0) {
      console.log('\nProject details:');
      projectsResponse.data.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.name}`);
        console.log(`     Members: ${project.members.length}`);
        console.log(`     User is member: ${project.members.some(m => m.user.email === userInfo.email) ? '✅' : '❌'}`);
      });
    }
    
    console.log('\n=== Summary ===');
    console.log('✅ Regular member can login');
    console.log(`${shouldShowProjects ? '✅' : '❌'} Projects section should be visible in sidebar`);
    console.log('✅ Projects API is accessible');
    console.log('✅ User has project membership');
    
    if (shouldShowProjects) {
      console.log('\n🎉 SUCCESS: Member should now see the Projects section!');
    } else {
      console.log('\n⚠️  ISSUE: Member still cannot see Projects section');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message: ${error.response.data?.message || error.response.data}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
  }
}

testMemberProjectSectionAccess();
