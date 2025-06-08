import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"

const extractionPrompt = `You are a data extraction specialist. Extract travel information from the conversation and return it as a JSON object.

Extract the following information if mentioned:
- destinations: array of countries/cities mentioned
- travelDates: object with startDate and endDate (YYYY-MM-DD format) or flexible dates description
- travelers: object with adults count, children count, and any age details
- budget: object with amount per person and currency, or budget range description
- accommodation: preference level (luxury, mid-range, budget, mixed)
- interests: array of travel interests/activities mentioned
- specialRequirements: any special needs, dietary restrictions, accessibility requirements
- completeness: percentage of how complete the information is (0-100)

Return ONLY a valid JSON object with the extracted information. Use null for missing information.

Example response:
{
  "destinations": ["Peru", "Brazil"],
  "travelDates": {
    "startDate": "2026-05-23",
    "endDate": "2026-06-05",
    "flexible": false
  },
  "travelers": {
    "adults": 4,
    "children": 0
  },
  "budget": {
    "amount": 2400,
    "currency": "USD",
    "perPerson": true
  },
  "accommodation": "mid-range",
  "interests": ["culture", "food", "adventure"],
  "specialRequirements": null,
  "completeness": 85
}`

export async function POST(request: NextRequest) {
  try {
    console.log("Extract form data API called")

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("OPENAI_API_KEY not found for data extraction")
      return NextResponse.json(
        {
          error: "OpenAI API key not configured",
          data: { completeness: 0 }, // Return minimal data structure
        },
        { status: 500 },
      )
    }

    const { conversationHistory } = await request.json()

    if (!conversationHistory || conversationHistory.length === 0) {
      console.log("No conversation history provided")
      return NextResponse.json({
        data: {
          destinations: null,
          travelDates: null,
          travelers: null,
          budget: null,
          accommodation: null,
          interests: null,
          specialRequirements: null,
          completeness: 0,
        },
      })
    }

    // Build conversation context
    const conversationText = conversationHistory
      .map((msg: any) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n")

    console.log("Extracting data from conversation length:", conversationText.length)

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: extractionPrompt,
        prompt: `Extract travel information from this conversation:\n\n${conversationText}`,
        maxTokens: 500,
        temperature: 0.1,
      })

      console.log("Raw extraction result:", text)

      try {
        const extractedData = JSON.parse(text)
        console.log("Parsed extraction data:", extractedData)
        return NextResponse.json({ data: extractedData })
      } catch (parseError) {
        console.error("Failed to parse extracted data:", parseError)
        console.error("Raw text was:", text)

        // Return a basic structure if parsing fails
        return NextResponse.json({
          data: {
            destinations: null,
            travelDates: null,
            travelers: null,
            budget: null,
            accommodation: null,
            interests: null,
            specialRequirements: null,
            completeness: 10,
          },
          error: "Failed to parse extracted data",
        })
      }
    } catch (openaiError: any) {
      console.error("OpenAI error in data extraction:", openaiError)
      return NextResponse.json({
        data: {
          destinations: null,
          travelDates: null,
          travelers: null,
          budget: null,
          accommodation: null,
          interests: null,
          specialRequirements: null,
          completeness: 0,
        },
        error: "Failed to extract data due to AI service error",
      })
    }
  } catch (error: any) {
    console.error("Error in extract form data API:", error)
    return NextResponse.json({
      data: {
        destinations: null,
        travelDates: null,
        travelers: null,
        budget: null,
        accommodation: null,
        interests: null,
        specialRequirements: null,
        completeness: 0,
      },
      error: "Internal server error",
    })
  }
}
