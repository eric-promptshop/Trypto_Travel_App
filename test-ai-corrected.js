const http = require('http');

// Test AI itinerary generation with correct format
function testItineraryGeneration() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      preferences: {
        primaryDestination: "Paris, France",
        startDate: "2024-07-01",
        endDate: "2024-07-04",
        travelers: {
          adults: 2,
          children: 0
        },
        budget: {
          total: 3000,
          currency: "USD"
        },
        interests: ["culture", "food", "history"],
        pace: "moderate",
        accommodationType: "hotel"
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
            console.log(`From Cache: ${response.fromCache || false}`);
            console.log(`Generation Time: ${Math.round(response.generationTime)}ms`);
            
            const itinerary = response.itinerary;
            if (itinerary) {
              console.log(`\nItinerary Overview:`);
              console.log(`- Destination: ${itinerary.destination}`);
              console.log(`- Days: ${itinerary.days?.length || 0}`);
              console.log(`- Total Cost: $${itinerary.estimatedCost?.total || 'N/A'}`);
              
              if (itinerary.days?.[0]) {
                console.log(`\nDay 1 Activities:`);
                itinerary.days[0].activities?.slice(0, 3).forEach(activity => {
                  console.log(`  - ${activity.timeSlot?.startTime || 'N/A'}: ${activity.title}`);
                });
              }
            }
          } catch (e) {
            console.log('Error parsing response:', e.message);
            console.log('Response:', data.substring(0, 500) + '...');
          }
        } else {
          console.log('Error Response:', data);
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

// Run test
async function runTest() {
  console.log('Testing AI Itinerary Generation with Correct Format...\n');
  
  await testItineraryGeneration();
  
  console.log('\n\n✅ Test completed!');
}

runTest();