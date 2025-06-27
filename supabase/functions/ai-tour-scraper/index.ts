import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Replicate from 'https://esm.sh/replicate@0.18.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TourScrapeRequest {
  url: string
  operatorId: string
}

interface ExtractedTourData {
  name: string
  destination: string
  duration: string
  description: string
  shortDescription?: string
  highlights: string[]
  included: string[]
  excluded: string[]
  price?: {
    amount: number
    currency: string
    perPerson?: boolean
  }
  itinerary?: Array<{
    day: number
    title: string
    description: string
    activities: string[]
  }>
  categories?: string[]
  difficulty?: string
  groupSize?: {
    min: number
    max: number
  }
  languages?: string[]
  startingPoint?: string
  endingPoint?: string
  images?: string[]
  availability?: {
    type: 'daily' | 'weekly' | 'specific-dates'
    days?: string[]
    dates?: string[]
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url, operatorId } = await req.json() as TourScrapeRequest

    // Validate URL
    try {
      new URL(url)
    } catch {
      throw new Error('Invalid URL provided')
    }

    // Initialize Replicate
    const replicateToken = Deno.env.get('REPLICATE_API_TOKEN')
    if (!replicateToken) {
      throw new Error('Replicate API token not configured')
    }

    const replicate = new Replicate({
      auth: replicateToken,
    })

    // First, fetch the webpage content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch webpage: ${response.status}`)
    }

    const html = await response.text()

    // Use Replicate's LLaVA model for visual understanding if images are present
    // For now, we'll use a text-based extraction approach
    const extractionPrompt = `Extract tour information from the following HTML content. Return a JSON object with these fields:
    - name: The tour name
    - destination: Where the tour takes place
    - duration: How long the tour lasts
    - description: Full tour description
    - shortDescription: Brief summary (1-2 sentences)
    - highlights: Array of tour highlights
    - included: Array of what's included
    - excluded: Array of what's not included
    - price: Object with amount, currency, and perPerson boolean
    - itinerary: Array of day-by-day activities with day number, title, description, and activities
    - categories: Array of tour categories (e.g., "Adventure", "Cultural")
    - difficulty: Easy/Moderate/Challenging
    - groupSize: Object with min and max numbers
    - languages: Array of available languages
    - startingPoint: Where the tour starts
    - endingPoint: Where the tour ends
    - images: Array of image URLs found on the page

    HTML Content:
    ${html.substring(0, 8000)} // Limit to avoid token limits

    Return only valid JSON, no additional text.`

    // Use Replicate's Llama 2 model for text extraction
    const output = await replicate.run(
      "meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3",
      {
        input: {
          prompt: extractionPrompt,
          temperature: 0.3,
          max_new_tokens: 2000,
          system_prompt: "You are a tour information extraction assistant. Extract structured data from HTML content and return it as valid JSON only."
        }
      }
    ) as string[]

    // Parse the extracted data
    let extractedData: ExtractedTourData
    try {
      const jsonString = output.join('').trim()
      // Extract JSON from the response (sometimes wrapped in backticks or other text)
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      extractedData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Failed to parse extracted data:', parseError)
      // Fallback to a simpler extraction
      extractedData = extractBasicInfo(html, url)
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Store the extraction result
    const { data: storedResult, error: storeError } = await supabase
      .from('tour_scrape_results')
      .insert({
        operator_id: operatorId,
        source_url: url,
        extracted_data: extractedData,
        extraction_method: 'replicate-llama2',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (storeError) {
      console.error('Error storing scrape result:', storeError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        tourData: extractedData,
        scrapeId: storedResult?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error scraping tour:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Fallback basic extraction function
function extractBasicInfo(html: string, url: string): ExtractedTourData {
  // Extract title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : 'Tour'
  
  // Extract meta description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
  const description = descMatch ? descMatch[1] : ''
  
  // Extract images
  const imageMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)
  const images = Array.from(imageMatches)
    .map(match => {
      const src = match[1]
      if (src.startsWith('http')) return src
      if (src.startsWith('//')) return 'https:' + src
      if (src.startsWith('/')) {
        const urlObj = new URL(url)
        return urlObj.origin + src
      }
      return ''
    })
    .filter(img => img && !img.includes('logo') && !img.includes('icon'))
    .slice(0, 10)
  
  // Extract price (basic pattern matching)
  const priceMatch = html.match(/(?:\$|USD|EUR|£|€)\s*(\d+(?:\.\d{2})?)/i)
  const price = priceMatch ? {
    amount: parseFloat(priceMatch[1]),
    currency: 'USD',
    perPerson: true
  } : undefined
  
  return {
    name: title,
    destination: 'Unknown',
    duration: '1 day',
    description: description || 'No description available',
    highlights: [],
    included: [],
    excluded: [],
    price,
    images,
    categories: ['General']
  }
}