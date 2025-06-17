const axios = require('axios');

async function testTimesheetAPI() {
  try {
    console.log('Testing timesheet API directly...');
    
    // We need to get the auth token first, let's simulate this by checking what's in the auth header
    // For now, let's test the endpoint without auth to see if it hits our code
    
    const response = await axios.get('http://localhost:5000/api/reports/timesheet?startDate=2025-05-18&endDate=2025-06-17&project=&limit=50', {
      headers: {
        'Authorization': 'Bearer test-token' // This will fail auth but should trigger our logging
      }
    });
    
    console.log('Response:', response.data);
  } catch (error) {
    console.log('Error (expected):', error.response?.status, error.response?.data);
  }
}

testTimesheetAPI();
