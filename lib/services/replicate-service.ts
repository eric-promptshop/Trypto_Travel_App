// Dynamic import to avoid build warnings
interface ReplicateClient {
  run: (model: string, options: any) => Promise<any>;
  predictions: {
    create: (options: any) => Promise<any>;
    get: (id: string) => Promise<any>;
  };
}

export interface ReplicateModels {
  // Text generation models
  llama2_70b: string
  llama2_13b: string
  mistral_7b: string
  
  // Vision models
  llava: string
  blip2: string
  
  // Image generation
  sdxl: string
  sdxl_lightning: string
}

export const REPLICATE_MODELS: ReplicateModels = {
  // Text generation
  llama2_70b: 'meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3',
  llama2_13b: 'meta/llama-2-13b-chat:f4e2de70d66816a838a89eeeb621910adffb0dd0baba3976c96980970978018d',
  mistral_7b: 'mistralai/mistral-7b-instruct-v0.2:6282663877080e5116c0a644b326c3fec04000565372073f29397b0e42b8a7a1',
  
  // Vision models for analyzing tour images and websites
  llava: 'yorickvp/llava-13b:b5f6212d032508382d61ff00469ddda3e32fd8a0e75dc39d8a4191bb742157fb',
  blip2: 'salesforce/blip-2:4b32258c42e9efd4288bb9910bc532a69727f9acd26aa08e175713a0a857a608',
  
  // Image generation for creating tour visuals
  sdxl: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
  sdxl_lightning: 'bytedance/sdxl-lightning-4step:727e49a643e999d602a896c774a0658ffefea21465756a6ce24b7ea4165eba6a',
}

export class ReplicateService {
  private client: ReplicateClient | null = null;

  private async getClient(): Promise<ReplicateClient> {
    if (!this.client) {
      // Dynamic import to avoid build-time warnings
      const Replicate = (await import('replicate')).default;
      
      if (!process.env.REPLICATE_API_TOKEN) {
        throw new Error('REPLICATE_API_TOKEN is not set');
      }

      this.client = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
      });
    }
    return this.client;
  }

  /**
   * Extract tour information from a webpage using vision models
   */
  async extractTourFromWebpage(
    htmlContent: string,
    pageUrl: string,
    screenshotUrl?: string
  ): Promise<any> {
    try {
      // If we have a screenshot, use the vision model
      if (screenshotUrl) {
        const client = await this.getClient();
        const output = await client.run(REPLICATE_MODELS.llava, {
          input: {
            image: screenshotUrl,
            prompt: `Analyze this tour webpage screenshot and extract the following information in JSON format:
            - Tour name
            - Destination
            - Duration
            - Price
            - Description
            - Highlights (as array)
            - What's included (as array)
            - What's excluded (as array)
            - Tour schedule/itinerary
            - Meeting point
            - Important information
            
            Return only valid JSON, no additional text.`,
            temperature: 0.3,
            max_new_tokens: 2000,
          }
        })
        
        return this.parseJsonResponse(output)
      }
      
      // Otherwise use text extraction with Llama 2
      const client = await this.getClient();
      const output = await client.run(REPLICATE_MODELS.llama2_70b, {
        input: {
          prompt: this.buildTourExtractionPrompt(htmlContent),
          temperature: 0.3,
          max_new_tokens: 2000,
          system_prompt: 'You are a tour information extraction assistant. Extract structured data from HTML content and return it as valid JSON only.'
        }
      })
      
      return this.parseJsonResponse(output)
    } catch (error) {
      console.error('Replicate extraction error:', error)
      throw new Error(`Failed to extract tour information: ${error.message}`)
    }
  }

  /**
   * Generate travel recommendations based on user preferences
   */
  async generateRecommendations(
    userPreferences: any,
    context: any
  ): Promise<any> {
    try {
      const prompt = `Based on these travel preferences:
      ${JSON.stringify(userPreferences, null, 2)}
      
      And this context:
      ${JSON.stringify(context, null, 2)}
      
      Generate personalized travel recommendations including:
      - Top 5 recommended tours with reasons
      - Alternative destinations to consider
      - Best time to visit
      - Budget optimization tips
      - Special considerations
      
      Return as JSON format.`

      const client = await this.getClient();
      const output = await client.run(REPLICATE_MODELS.llama2_70b, {
        input: {
          prompt,
          temperature: 0.7,
          max_new_tokens: 2000,
          system_prompt: 'You are an expert travel advisor. Provide thoughtful, personalized recommendations based on user preferences.'
        }
      })
      
      return this.parseJsonResponse(output)
    } catch (error) {
      console.error('Replicate recommendation error:', error)
      throw new Error(`Failed to generate recommendations: ${error.message}`)
    }
  }

  /**
   * Generate tour descriptions and marketing copy
   */
  async generateTourCopy(
    tourData: any,
    targetAudience?: string
  ): Promise<{
    title: string
    shortDescription: string
    fullDescription: string
    highlights: string[]
    sellingPoints: string[]
  }> {
    try {
      const prompt = `Create compelling marketing copy for this tour:
      ${JSON.stringify(tourData, null, 2)}
      
      ${targetAudience ? `Target audience: ${targetAudience}` : ''}
      
      Generate:
      1. An engaging title (max 60 chars)
      2. A short description (max 150 chars)
      3. A full description (300-500 words)
      4. 5 key highlights
      5. 3 unique selling points
      
      Make it engaging, informative, and conversion-focused. Return as JSON.`

      const client = await this.getClient();
      const output = await client.run(REPLICATE_MODELS.mistral_7b, {
        input: {
          prompt,
          temperature: 0.8,
          max_new_tokens: 1500,
        }
      })
      
      return this.parseJsonResponse(output)
    } catch (error) {
      console.error('Replicate copy generation error:', error)
      throw new Error(`Failed to generate tour copy: ${error.message}`)
    }
  }

  /**
   * Generate tour images based on descriptions
   */
  async generateTourImage(
    tourName: string,
    destination: string,
    style: 'realistic' | 'artistic' | 'promotional' = 'promotional'
  ): Promise<string[]> {
    try {
      const stylePrompts = {
        realistic: 'photorealistic, high quality, professional travel photography',
        artistic: 'artistic, watercolor style, travel poster aesthetic',
        promotional: 'vibrant, engaging, professional marketing photo, travel brochure style'
      }

      const prompt = `${destination} tourism, ${tourName}, ${stylePrompts[style]}, beautiful scenery, high resolution, award winning photography`
      const negativePrompt = 'low quality, blurry, distorted, ugly, bad composition'

      const client = await this.getClient();
      const output = await client.run(REPLICATE_MODELS.sdxl_lightning, {
        input: {
          prompt,
          negative_prompt: negativePrompt,
          width: 1024,
          height: 768,
          num_outputs: 1,
          scheduler: 'K_EULER',
          num_inference_steps: 4,
          guidance_scale: 0,
        }
      }) as string[]
      
      return output
    } catch (error) {
      console.error('Replicate image generation error:', error)
      throw new Error(`Failed to generate tour image: ${error.message}`)
    }
  }

  /**
   * Analyze tour images to extract information
   */
  async analyzeTourImages(imageUrls: string[]): Promise<any> {
    try {
      const analyses = await Promise.all(
        imageUrls.slice(0, 5).map(async (imageUrl) => {
          const client = await this.getClient();
          const output = await client.run(REPLICATE_MODELS.blip2, {
            input: {
              image: imageUrl,
              question: 'What tourist activities and locations are shown in this image? Describe in detail.',
            }
          })
          
          return {
            imageUrl,
            description: output,
          }
        })
      )
      
      return analyses
    } catch (error) {
      console.error('Replicate image analysis error:', error)
      throw new Error(`Failed to analyze images: ${error.message}`)
    }
  }

  /**
   * Parse JSON response from model output
   */
  private parseJsonResponse(output: any): any {
    try {
      // Handle array output from Replicate
      const text = Array.isArray(output) ? output.join('') : String(output)
      
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Failed to parse JSON response:', error)
      console.error('Raw output:', output)
      
      // Return a structured fallback
      return {
        error: 'Failed to parse response',
        rawOutput: output
      }
    }
  }

  /**
   * Build tour extraction prompt
   */
  private buildTourExtractionPrompt(htmlContent: string): string {
    // Truncate HTML to avoid token limits
    const truncatedHtml = htmlContent.substring(0, 8000)
    
    return `Extract tour information from this HTML content and return as JSON:

${truncatedHtml}

Extract these fields:
{
  "name": "Tour name",
  "destination": "Location",
  "duration": "Duration",
  "price": { "amount": number, "currency": "USD", "perPerson": true },
  "description": "Full description",
  "shortDescription": "Brief summary",
  "highlights": ["highlight 1", "highlight 2"],
  "included": ["included item 1", "included item 2"],
  "excluded": ["excluded item 1", "excluded item 2"],
  "schedule": [{ "time": "9:00 AM", "activity": "..." }],
  "meetingPoint": "Meeting location",
  "importantInfo": ["info 1", "info 2"],
  "categories": ["category 1", "category 2"],
  "difficulty": "Easy/Moderate/Challenging",
  "groupSize": { "min": 1, "max": 20 },
  "languages": ["English", "Spanish"]
}

Return ONLY the JSON object, no other text.`
  }
}

// Export singleton instance
export const replicateService = new ReplicateService()