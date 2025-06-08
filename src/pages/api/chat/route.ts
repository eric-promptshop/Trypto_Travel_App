import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"

// Import itinerary data for context
const itineraryData = [
  {
    day: 1,
    title: "Arrival to the City of Kings",
    location: "LIMA, PERU",
    date: "MON 23 MAY '26",
    description:
      "Lima may be the political capital of Peru, but when it comes to gastronomy, it is one of the capitals of the world! Food is certainly going to be a theme during your stay in Lima – that is for sure. On arrival in this culinary paradise, your private guide will be waiting at the airport to assist you through check-in at your hotel.",
    additionalInfo:
      "This evening, use our guide book to help unearth the city's treasure trove of fantastic restaurants and bars during the evening, at your leisure. Restaurants like Astrid & Gaston, or Central, are just two of many in the city that year after year rank among the top 100 best restaurants in the world.",
  },
  {
    day: 2,
    title: "Lima like a Local",
    location: "LIMA, PERU",
    date: "TUE 24 MAY '26",
    description:
      "This fascinating walking tour will help you gain a little insight into the local Limeño culture and history. After being picked up from your hotel at 9 am, the taxi will take you to the Miraflores market, where Peruvian merchants will enlighten you on the local produce and outline the different types of potatoes, corn, and fruits that can be found in Peru. Feel free to grab some samples and don't forget to try the coca leaves!",
    additionalInfo:
      "Following a short meander through the market, you will then hop on the public bus 'Metropolitano' to the historic center, where you can admire grand colonial buildings. The Historic Center of Lima has been the seat of the Colonial and Republican governments since the Spanish foundation of the city in 1535 and is also an important indigenous center.",
  },
  {
    day: 3,
    title: "Into the Amazon",
    location: "PUERTO MALDONADO, PERU",
    date: "WED 25 MAY '26",
    description:
      "Today you'll journey into the Amazon rainforest, starting from Puerto Maldonado. After a short flight from Lima, you'll travel by boat along the Madre de Dios River to your jungle lodge. Keep your eyes peeled for wildlife along the riverbanks as you enter one of the most biodiverse regions on Earth.",
  },
  {
    day: 4,
    title: "Cusco Exploration",
    location: "CUSCO, PERU",
    date: "THU 26 MAY '26",
    description:
      "Today you'll explore the ancient Inca capital of Cusco, known for its archaeological remains and Spanish colonial architecture. Your guide will take you through the historic center and to nearby ruins.",
  },
  {
    day: 5,
    title: "Sacred Valley",
    location: "SACRED VALLEY, PERU",
    date: "FRI 27 MAY '26",
    description:
      "Journey through the Sacred Valley of the Incas, visiting the ancient terraces of Pisac and the fortress of Ollantaytambo. You'll experience local markets and witness traditional weaving demonstrations.",
  },
  {
    day: 6,
    title: "Machu Picchu",
    location: "MACHU PICCHU, PERU",
    date: "SAT 28 MAY '26",
    description:
      "Early morning train to Machu Picchu, one of the New Seven Wonders of the World. Your expert guide will lead you through this incredible ancient city, explaining its history and significance.",
  },
  {
    day: 7,
    title: "Flight to Rio de Janeiro",
    location: "RIO DE JANEIRO, BRAZIL",
    date: "SUN 29 MAY '26",
    description:
      "Today you'll fly from Peru to Brazil, arriving in the vibrant city of Rio de Janeiro. After checking into your hotel, enjoy a relaxing evening on Copacabana Beach.",
  },
]

export async function POST(request: NextRequest) {
  try {
    console.log("Chat API called")

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("OPENAI_API_KEY not found in environment variables")
      return NextResponse.json(
        {
          error: "OpenAI API key not configured",
          response:
            "I'm sorry, but I'm not properly configured right now. Please check that your OpenAI API key is set up correctly.",
        },
        { status: 500 },
      )
    }

    const { message, context } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Build system prompt with itinerary data and user context
    const systemPrompt = `You are a helpful travel assistant for Trypto, specializing in South American travel itineraries. 
You have detailed knowledge of Peru and Brazil and can help with questions about:

- Daily activities and locations
- Travel logistics and recommendations
- Local culture and attractions
- Food and dining suggestions
- Practical travel tips
- Modifications to the itinerary
- Weather and packing advice
- Language and cultural tips
- Safety information

Current Trip Context: ${context || "Peru & Brazil trip for 4 travelers, 13 days, $2,400/person, 3-star hotels"}

Here is the detailed itinerary:
${itineraryData
  .map(
    (day) => `
Day ${day.day}: ${day.title}
Location: ${day.location}
Date: ${day.date}
Description: ${day.description}
${day.additionalInfo ? `Additional Info: ${day.additionalInfo}` : ""}
`,
  )
  .join("\n")}

Additional Knowledge:
- Lima is known for its world-class cuisine, especially ceviche and pisco sours
- Machu Picchu requires advance booking and can be crowded; early morning visits are best
- Cusco is at high altitude (11,200 feet) - recommend arriving a day early to acclimatize
- Amazon region has high humidity and requires insect repellent
- Rio de Janeiro highlights include Christ the Redeemer, Sugarloaf Mountain, and Copacabana Beach
- May is autumn in South America - mild temperatures, less rain
- Spanish is spoken in Peru, Portuguese in Brazil
- Peruvian Sol and Brazilian Real are the currencies
- Altitude sickness medication recommended for Cusco/Machu Picchu

Guidelines:
- Be helpful, friendly, and knowledgeable about South American travel
- Provide specific, actionable recommendations
- If asked about modifications, suggest realistic alternatives with reasoning
- Always consider the context of the specific itinerary and dates
- Keep responses conversational but informative (2-4 sentences typically)
- Use emojis sparingly but appropriately
- If you don't know something specific, acknowledge it and provide general helpful advice
- For packing questions, consider the destinations and season
- For food questions, mention specific dishes and restaurants when relevant`

    try {
      console.log("Sending to OpenAI with message:", message)

      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: systemPrompt,
        prompt: message,
        maxTokens: 500,
        temperature: 0.7,
      })

      console.log("OpenAI response received")
      return NextResponse.json({ response: text })
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)

      let errorMessage = "I'm having trouble connecting to my AI service right now."

      if (openaiError.message?.includes("401")) {
        errorMessage = "Invalid OpenAI API key. Please check your configuration."
      } else if (openaiError.message?.includes("429")) {
        errorMessage = "I'm getting a lot of requests right now. Please wait a moment and try again."
      } else if (openaiError.message?.includes("quota")) {
        errorMessage = "I've reached my usage limit for now. Please try again later."
      }

      return NextResponse.json({ error: errorMessage, response: errorMessage }, { status: 500 })
    }
  } catch (error: any) {
    console.error("General error in chat API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        response: "I'm sorry, something went wrong. Please try again in a moment.",
      },
      { status: 500 },
    )
  }
}
