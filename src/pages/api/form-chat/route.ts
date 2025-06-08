import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"

const systemPrompt = `You are Trypto's AI travel assistant helping users plan their custom trips. Your role is to gather travel information through natural conversation while being helpful and engaging.

IMPORTANT GUIDELINES:
1. Always respond in a conversational, friendly tone
2. Ask ONE question at a time to avoid overwhelming users
3. Validate and acknowledge information provided before moving to the next topic
4. Provide helpful suggestions and examples
5. Keep responses concise (2-3 sentences max)
6. Use emojis sparingly but appropriately

INFORMATION TO GATHER:
- Destinations (countries/cities they want to visit)
- Travel dates (when they want to travel)
- Number of travelers (adults, children, ages if relevant)
- Budget range per person
- Accommodation preferences (luxury, mid-range, budget)
- Travel interests (culture, adventure, food, relaxation, etc.)
- Special requirements or preferences

CONVERSATION FLOW:
1. Start with a warm greeting and ask about their dream destination
2. Once destination is clear, ask about travel dates
3. Then number of travelers
4. Budget preferences
5. Accommodation level
6. Travel interests and activities
7. Any special requirements

RESPONSE FORMAT:
- Acknowledge what they've shared
- Ask the next logical question
- Provide helpful context or suggestions when relevant
- If information is unclear, ask for clarification politely

VALIDATION RULES:
- Dates should be in the future
- Budget should be realistic for the destination
- Group size should be reasonable
- Suggest alternatives if something seems unrealistic

Remember: You're building excitement for their trip while gathering practical information!`

export async function POST(request: NextRequest) {
  try {
    console.log("Form chat API called")

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("OPENAI_API_KEY not found in environment variables")
      return NextResponse.json(
        {
          error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.",
          fallbackResponse:
            "I'm sorry, but I'm not properly configured right now. Please check that your OpenAI API key is set up correctly in your environment variables.",
        },
        { status: 500 },
      )
    }

    const body = await request.json()
    console.log("Request body:", body)

    const { message, conversationHistory } = body

    if (!message) {
      console.error("No message provided in request")
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Build conversation context
    const conversationContext =
      conversationHistory
        ?.map((msg: any) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n") || ""

    const fullPrompt = conversationContext
      ? `Previous conversation:\n${conversationContext}\n\nUser's latest message: ${message}`
      : `User's message: ${message}`

    console.log("Sending to OpenAI with prompt length:", fullPrompt.length)

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: systemPrompt,
        prompt: fullPrompt,
        maxTokens: 300,
        temperature: 0.8,
      })

      console.log("OpenAI response received, length:", text.length)
      return NextResponse.json({ response: text })
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)

      // Provide specific error messages based on the error type
      let errorMessage = "I'm having trouble connecting to my AI service right now."
      let fallbackResponse =
        "I apologize, but I'm experiencing technical difficulties. Could you please try again in a moment?"

      if (openaiError.message?.includes("401")) {
        errorMessage = "Invalid OpenAI API key"
        fallbackResponse =
          "It looks like there's an authentication issue with my AI service. Please check your API key configuration."
      } else if (openaiError.message?.includes("429")) {
        errorMessage = "OpenAI rate limit exceeded"
        fallbackResponse = "I'm getting a lot of requests right now. Please wait a moment and try again."
      } else if (openaiError.message?.includes("quota")) {
        errorMessage = "OpenAI quota exceeded"
        fallbackResponse = "I've reached my usage limit for now. Please try again later or contact support."
      }

      return NextResponse.json(
        {
          error: errorMessage,
          fallbackResponse: fallbackResponse,
          details: openaiError.message,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("General error in form chat API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        fallbackResponse: "I'm sorry, something went wrong on my end. Please try refreshing the page and trying again.",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
