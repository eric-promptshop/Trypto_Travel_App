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

console.log("🧪 Testing itinerary generation flow...");
console.log("📋 Test data:", JSON.stringify(testFormData, null, 2));

// Test the API endpoint
async function testAPI() {
  try {
    console.log("\n🚀 Calling /api/trips-ai/generate...");
    const response = await fetch("http://localhost:3000/api/trips-ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(testFormData)
    });

    console.log("📡 Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", errorText);
      return;
    }

    const result = await response.json();
    console.log("✅ API Response received");
    console.log("📊 Result summary:", {
      success: result.success,
      hasItinerary: !!result.itinerary,
      dayCount: result.itinerary?.days?.length || 0,
      generationTime: result.generationTime
    });

    if (result.itinerary) {
      console.log("\n🗓️ Itinerary details:");
      console.log("- Destination:", result.itinerary.destination);
      console.log("- Duration:", result.itinerary.duration, "days");
      console.log("- Total cost:", result.itinerary.estimatedTotalCost);
      console.log("- Days:", result.itinerary.days.map(d => d.title).join(", "));
    }

  } catch (error) {
    console.error("💥 Test failed:", error);
  }
}

// Instructions for debugging
console.log("\n📝 Instructions:");
console.log("1. Make sure the development server is running (npm run dev)");
console.log("2. Check that OPENAI_API_KEY is set in .env.local");
console.log("3. Watch the server console for detailed logs");
console.log("4. If the request hangs, check for infinite loops or missing await statements");

// Run the test
if (process.argv.includes("--run")) {
  testAPI();
} else {
  console.log("\n👉 Run with: node debug-itinerary.js --run");
}