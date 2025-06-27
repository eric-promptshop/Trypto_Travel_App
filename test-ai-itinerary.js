const http = require('http');

// Test AI itinerary generation
function testItineraryGeneration() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      destination: "Paris, France",
      duration: 3,
      travelers: 2,
      budget: "moderate",
      interests: ["culture", "food", "history"],
      travelDates: {
        start: "2024-07-01",
        end: "2024-07-04"
      }
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/generate-itinerary',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\nAI Itinerary Generation Test`);
        console.log(`Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log('\n✅ Itinerary generated successfully!');
            console.log(`Destination: ${response.data?.destination}`);
            console.log(`Days: ${response.data?.days?.length || 0}`);
            
            if (response.data?.days?.[0]) {
              console.log(`\nDay 1 Preview:`);
              response.data.days[0].activities.slice(0, 2).forEach(activity => {
                console.log(`- ${activity.time}: ${activity.name}`);
              });
            }
          } catch (e) {
            console.log('Response:', data.substring(0, 500) + '...');
          }
        } else {
          console.log('Response:', data);
        }
        
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
      resolve({ status: 'error', error: error.message });
    });

    req.write(postData);
    req.end();
  });
}

// Test trips AI generation (alternative endpoint)
function testTripsAIGeneration() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      preferences: {
        destination: "Tokyo, Japan",
        duration: 5,
        budget: "luxury",
        interests: ["technology", "anime", "food"],
        travelers: 1
      }
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/trips-ai/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\n\nTrips AI Generation Test`);
        console.log(`Status: ${res.statusCode}`);
        console.log('Response preview:', data.substring(0, 300) + '...');
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
      resolve({ status: 'error', error: error.message });
    });

    req.write(postData);
    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('Testing AI Itinerary Generation...\n');
  
  await testItineraryGeneration();
  await testTripsAIGeneration();
  
  console.log('\n\n✅ AI tests completed!');
}

runTests();