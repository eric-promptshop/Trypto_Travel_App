import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface ExtractedTourData {
  name: string
  destination: string
  duration: string
  description: string
  highlights: string[]
  inclusions: string[]
  exclusions: string[]
  price?: {
    amount: number
    currency: string
  }
  itinerary?: {
    day: number
    title: string
    description: string
    activities: string[]
  }[]
  categories?: string[]
  difficulty?: string
  groupSize?: {
    min: number
    max: number
  }
  languages?: string[]
  startingPoint?: string
  endingPoint?: string
  accommodation?: string
  meals?: string
  transportation?: string
}

export class TourOnboardingService {
  /**
   * Extract tour information from uploaded text content (PDF, Word, etc.)
   */
  static async extractTourFromDocument(content: string): Promise<ExtractedTourData> {
    try {
      
      const systemPrompt = `You are an expert at extracting structured tour information from tour operator documents.
      Extract all relevant information about the tour and format it as structured JSON data.
      
      Look for:
      - Tour name/title
      - Destination(s)
      - Duration (days/nights)
      - Detailed description
      - Highlights/key features
      - What's included
      - What's excluded
      - Pricing information
      - Day-by-day itinerary
      - Categories (adventure, cultural, luxury, etc.)
      - Difficulty level
      - Group size limits
      - Available languages
      - Meeting/starting point
      - Drop-off/ending point
      - Accommodation details
      - Meal arrangements
      - Transportation details
      
      If certain information is not available, omit those fields.`

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extract tour information from this document:\n\n${content}` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 2000
      })

      const result = response.choices[0].message.content
      if (!result) {
        throw new Error('No response from AI')
      }

      const extractedData = JSON.parse(result) as ExtractedTourData
      
      return extractedData
    } catch (error) {
      console.error('[TourOnboardingService] Error extracting tour data:', error)
      throw error
    }
  }

  /**
   * Extract tour information from images (brochures, flyers, etc.)
   */
  static async extractTourFromImage(imageBase64: string): Promise<ExtractedTourData> {
    try {
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract all tour information from this image and format as JSON with the following structure:
                {
                  "name": "tour name",
                  "destination": "destination",
                  "duration": "X days / Y nights",
                  "description": "detailed description",
                  "highlights": ["highlight 1", "highlight 2"],
                  "inclusions": ["included item 1", "included item 2"],
                  "exclusions": ["excluded item 1", "excluded item 2"],
                  "price": { "amount": 0, "currency": "USD" },
                  "itinerary": [{ "day": 1, "title": "Day 1", "description": "...", "activities": [] }],
                  "categories": ["category1", "category2"],
                  "difficulty": "easy/moderate/challenging",
                  "groupSize": { "min": 2, "max": 20 },
                  "languages": ["English", "Spanish"],
                  "startingPoint": "location",
                  "endingPoint": "location",
                  "accommodation": "hotel type",
                  "meals": "meal plan",
                  "transportation": "transport details"
                }`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000
      })

      const result = response.choices[0].message.content
      if (!result) {
        throw new Error('No response from AI')
      }

      const extractedData = JSON.parse(result) as ExtractedTourData
      
      return extractedData
    } catch (error) {
      console.error('[TourOnboardingService] Error extracting tour data from image:', error)
      throw error
    }
  }

  /**
   * Generate SEO-optimized content for the tour
   */
  static async generateSEOContent(tourData: ExtractedTourData): Promise<{
    metaTitle: string
    metaDescription: string
    keywords: string[]
    sellingPoints: string[]
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert travel content writer specializing in SEO optimization.'
          },
          {
            role: 'user',
            content: `Generate SEO-optimized content for this tour:
            Name: ${tourData.name}
            Destination: ${tourData.destination}
            Duration: ${tourData.duration}
            Description: ${tourData.description}
            
            Create:
            1. An SEO-optimized meta title (50-60 characters)
            2. A compelling meta description (150-160 characters)
            3. Relevant keywords (10-15 keywords)
            4. Unique selling points (3-5 bullet points)
            
            Format as JSON.`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 500
      })

      const result = response.choices[0].message.content
      if (!result) {
        throw new Error('No response from AI')
      }

      return JSON.parse(result)
    } catch (error) {
      console.error('[TourOnboardingService] Error generating SEO content:', error)
      throw error
    }
  }

  /**
   * Validate and enhance tour data
   */
  static validateAndEnhanceTourData(tourData: ExtractedTourData): ExtractedTourData {
    // Ensure required fields
    if (!tourData.name || !tourData.destination || !tourData.duration) {
      throw new Error('Missing required tour information')
    }

    // Set defaults for optional fields
    const enhanced = { ...tourData }

    // Default categories if not provided
    if (!enhanced.categories || enhanced.categories.length === 0) {
      enhanced.categories = ['general']
    }

    // Default difficulty if not provided
    if (!enhanced.difficulty) {
      enhanced.difficulty = 'moderate'
    }

    // Default group size if not provided
    if (!enhanced.groupSize) {
      enhanced.groupSize = { min: 2, max: 20 }
    }

    // Default language if not provided
    if (!enhanced.languages || enhanced.languages.length === 0) {
      enhanced.languages = ['English']
    }

    return enhanced
  }
}