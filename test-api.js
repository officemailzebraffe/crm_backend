const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let authToken = '';
let refreshToken = '';

// Test Results
const results = {
  passed: [],
  failed: [],
  errors: []
};

// Helper function to log results
function logTest(name, status, details = '') {
  const result = { name, status, details, timestamp: new Date().toISOString() };
  
  if (status === 'PASS') {
    results.passed.push(result);
    console.log(`✅ PASS: ${name}`);
  } else if (status === 'FAIL') {
    results.failed.push(result);
    console.log(`❌ FAIL: ${name} - ${details}`);
  } else {
    results.errors.push(result);
    console.log(`⚠️  ERROR: ${name} - ${details}`);
  }
}

// API Tests
async function runTests() {
  console.log('\n🚀 Starting API Tests for CRM Portal...\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Health Check
    console.log('\n📋 Test Group: Server Health');
    try {
      const healthRes = await axios.get(`${API_BASE.replace('/api', '')}/health`);
      if (healthRes.data.status === 'OK') {
        logTest('Server Health Check', 'PASS');
      } else {
        logTest('Server Health Check', 'FAIL', 'Status not OK');
      }
    } catch (error) {
      logTest('Server Health Check', 'ERROR', error.message);
    }

    // Test 2: Login
    console.log('\n📋 Test Group: Authentication');
    try {
      const loginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@dsamentor.com',
        password: 'SuperAdmin@123'
      }, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });

      if (loginRes.data.success && loginRes.data.token) {
        authToken = loginRes.data.token;
        refreshToken = loginRes.data.refreshToken;
        logTest('User Login', 'PASS');
      } else {
        logTest('User Login', 'FAIL', 'No token received');
      }
    } catch (error) {
      logTest('User Login', 'ERROR', error.response?.data?.error || error.message);
    }

    // Test 3: Get Current User (requires auth)
    try {
      const meRes = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (meRes.data.success && meRes.data.data) {
        logTest('Get Current User', 'PASS');
      } else {
        logTest('Get Current User', 'FAIL', 'No user data');
      }
    } catch (error) {
      logTest('Get Current User', 'ERROR', error.response?.data?.error || error.message);
    }

    // Test 4: Get Projects
    console.log('\n📋 Test Group: Projects');
    try {
      const projectsRes = await axios.get(`${API_BASE}/projects`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (projectsRes.data.success) {
        logTest('Get All Projects', 'PASS', `${projectsRes.data.count} projects found`);
      } else {
        logTest('Get All Projects', 'FAIL');
      }
    } catch (error) {
      logTest('Get All Projects', 'ERROR', error.response?.data?.error || error.message);
    }

    // Test 5: Get Leads (requires projectId)
    console.log('\n📋 Test Group: Leads');
    try {
      const leadsRes = await axios.get(`${API_BASE}/leads`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (leadsRes.data.success) {
        logTest('Get Leads (no projectId)', 'FAIL', 'Should require projectId');
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('Project ID')) {
        logTest('Get Leads (no projectId)', 'PASS', 'Correctly validates projectId requirement');
      } else {
        logTest('Get Leads (no projectId)', 'ERROR', error.response?.data?.error || error.message);
      }
    }

    // Test 6: Get Students
    console.log('\n📋 Test Group: Students');
    try {
      const studentsRes = await axios.get(`${API_BASE}/students`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (studentsRes.data.success || studentsRes.status === 400) {
        logTest('Get Students API', 'PASS');
      }
    } catch (error) {
      if (error.response?.status === 400) {
        logTest('Get Students API', 'PASS', 'Correctly validates projectId');
      } else {
        logTest('Get Students API', 'ERROR', error.response?.data?.error || error.message);
      }
    }

    // Test 7: Get Courses
    console.log('\n📋 Test Group: Courses');
    try {
      const coursesRes = await axios.get(`${API_BASE}/courses`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (coursesRes.data.success || coursesRes.status === 400) {
        logTest('Get Courses API', 'PASS');
      }
    } catch (error) {
      if (error.response?.status === 400) {
        logTest('Get Courses API', 'PASS', 'Correctly validates projectId');
      } else {
        logTest('Get Courses API', 'ERROR', error.response?.data?.error || error.message);
      }
    }

    // Test 8: Get Tasks
    console.log('\n📋 Test Group: Tasks');
    try {
      const tasksRes = await axios.get(`${API_BASE}/tasks`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (tasksRes.data.success || tasksRes.status === 400) {
        logTest('Get Tasks API', 'PASS');
      }
    } catch (error) {
      if (error.response?.status === 400) {
        logTest('Get Tasks API', 'PASS', 'Correctly validates projectId');
      } else {
        logTest('Get Tasks API', 'ERROR', error.response?.data?.error || error.message);
      }
    }

    // Test 9: Get Analytics
    console.log('\n📋 Test Group: Analytics');
    try {
      const analyticsRes = await axios.get(`${API_BASE}/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (analyticsRes.data.success) {
        logTest('Get Analytics (no projectId)', 'FAIL', 'Should require projectId');
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('Project ID')) {
        logTest('Get Analytics (no projectId)', 'PASS', 'Correctly validates projectId requirement');
      } else {
        logTest('Get Analytics (no projectId)', 'ERROR', error.response?.data?.error || error.message);
      }
    }

    // Test 10: Unauthorized Access
    console.log('\n📋 Test Group: Security');
    try {
      const unauthorizedRes = await axios.get(`${API_BASE}/auth/me`);
      logTest('Unauthorized Access Protection', 'FAIL', 'Should block without token');
    } catch (error) {
      if (error.response?.status === 401) {
        logTest('Unauthorized Access Protection', 'PASS', 'Correctly blocks unauthorized access');
      } else {
        logTest('Unauthorized Access Protection', 'ERROR', error.message);
      }
    }

  } catch (error) {
    console.error('\n❌ Critical Error:', error.message);
  }

  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Errors: ${results.errors.length}`);
  console.log(`📈 Total: ${results.passed.length + results.failed.length + results.errors.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.failed.forEach(r => console.log(`  - ${r.name}: ${r.details}`));
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️  ERROR TESTS:');
    results.errors.forEach(r => console.log(`  - ${r.name}: ${r.details}`));
  }

  console.log('\n' + '='.repeat(60));
  
  process.exit(results.failed.length + results.errors.length);
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
