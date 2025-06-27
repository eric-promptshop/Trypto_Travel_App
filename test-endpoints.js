const http = require('http');

// Test endpoint function
function testEndpoint(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\n${method} ${path}`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data.substring(0, 200)}...`);
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error(`Error testing ${path}:`, error.message);
      resolve({ status: 'error', error: error.message });
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('Testing Travel Itinerary Builder Endpoints...\n');

  // Test health endpoint
  await testEndpoint('/api/health');

  // Test main page
  await testEndpoint('/');

  // Test authentication endpoint
  await testEndpoint('/api/auth/signin', 'GET');

  // Test places search (will likely need auth)
  await testEndpoint('/api/places/search?query=paris');

  // Test trips endpoint
  await testEndpoint('/api/trips');

  console.log('\n✅ Basic endpoint tests completed!');
}

runTests();