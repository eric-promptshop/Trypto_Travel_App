// Debug script to test the itinerary generation flow
// Run with: node debug-itinerary.js

const testFormData = {
  destination: "Paris, France",
  dates: {
    from: "2025-02-01",
    to: "2025-02-05"
  },
  travelers: 2,
  budget: [2000, 5000],
  interests: ["culture", "food", "museums"],
  email: "test@example.com",
  name: "Test User"
};


// Test the API endpoint
async function testAPI() {
  try {
    const response = await fetch("http://localhost:3000/api/trips-ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(testFormData)
    });

    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", errorText);
      return;
    }

    const result = await response.json();
      success: result.success,
      hasItinerary: !!result.itinerary,
      dayCount: result.itinerary?.days?.length || 0,
      generationTime: result.generationTime
    });

    if (result.itinerary) {
    }

  } catch (error) {
    console.error("💥 Test failed:", error);
  }
}

// Instructions for debugging

// Run the test
if (process.argv.includes("--run")) {
  testAPI();
} else {
}