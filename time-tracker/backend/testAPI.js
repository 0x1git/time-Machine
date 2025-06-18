const axios = require('axios');

async function testTimesheetAPI() {
  try {
    console.log('🧪 Testing timesheet API directly...');
      // First login to get auth token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@timetracker.com',
      password: 'admin123' // admin password
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, got token');
    
    // Test timesheet endpoint
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    };
    
    const today = new Date();
    const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const params = {
      startDate: threeMonthsAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      limit: 50,
      _cb: Date.now()
    };
    
    console.log('📅 Testing with date range:', params.startDate, 'to', params.endDate);
    
    const response = await axios.get('http://localhost:5000/api/reports/timesheet', {
      ...config,
      params
    });
    
    console.log('📊 API Response:');
    console.log('  - Status:', response.status);
    console.log('  - Time entries count:', response.data.timeEntries?.length || 0);
    console.log('  - Totals:', response.data.totals);
    console.log('  - Total duration formatted:', formatTime(response.data.totals?.totalDuration || 0));
    
    // Test with specific project
    if (response.data.timeEntries?.length > 0) {
      const firstEntry = response.data.timeEntries[0];
      if (firstEntry.project) {
        console.log('\n🎯 Testing with specific project:', firstEntry.project.name);
        
        const projectParams = {
          ...params,
          project: firstEntry.project._id || firstEntry.project
        };
        
        const projectResponse = await axios.get('http://localhost:5000/api/reports/timesheet', {
          ...config,
          params: projectParams
        });
        
        console.log('📊 Project-specific API Response:');
        console.log('  - Time entries count:', projectResponse.data.timeEntries?.length || 0);
        console.log('  - Totals:', projectResponse.data.totals);
        console.log('  - Total duration formatted:', formatTime(projectResponse.data.totals?.totalDuration || 0));
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.response?.data || error.message);
  }
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) {
    return "0h 0m";
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

testTimesheetAPI();
