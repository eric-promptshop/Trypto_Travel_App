import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LeadEnrichmentRequest {
  leadId: string
  leadData: {
    email: string
    destination?: string
    startDate?: string
    endDate?: string
    travelers?: number
    budget?: any
    interests?: string[]
    specialRequests?: string
    itinerary?: any
    context?: any
  }
}

interface EnrichedLeadData {
  travelPersona: string
  tripType: string
  decisionStage: 'research' | 'planning' | 'ready-to-book' | 'booked'
  estimatedValue: number
  recommendations: {
    tours: string[]
    destinations: string[]
    activities: string[]
    accommodations: string[]
  }
  engagementStrategy: {
    nextBestAction: string
    personalizedMessage: string
    followUpTiming: string
    channelPreference: 'email' | 'sms' | 'phone'
  }
  insights: {
    budgetTier: 'budget' | 'mid-range' | 'luxury'
    groupType: 'solo' | 'couple' | 'family' | 'group'
    travelStyle: string[]
    specialNeeds: string[]
  }
  scoringFactors: {
    engagementScore: number
    readinessScore: number
    valueScore: number
    fitScore: number
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { leadId, leadData } = await req.json() as LeadEnrichmentRequest

    // Initialize OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const configuration = new Configuration({
      apiKey: openaiApiKey,
    })
    const openai = new OpenAIApi(configuration)

    // Build enrichment prompt
    const systemPrompt = `You are a lead enrichment AI for a travel company. Analyze lead data to provide deep insights about travel preferences, readiness to book, and personalized recommendations. Consider psychological factors, travel patterns, and decision-making stages.`

    const userPrompt = `Analyze this lead and provide enrichment data:

Email: ${leadData.email}
Destination: ${leadData.destination || 'Not specified'}
Travel Dates: ${leadData.startDate ? `${leadData.startDate} to ${leadData.endDate}` : 'Not specified'}
Travelers: ${leadData.travelers || 'Not specified'}
Budget: ${leadData.budget ? JSON.stringify(leadData.budget) : 'Not specified'}
Interests: ${leadData.interests?.join(', ') || 'Not specified'}
Special Requests: ${leadData.specialRequests || 'None'}
Has Itinerary: ${leadData.itinerary ? 'Yes' : 'No'}
Context: ${JSON.stringify(leadData.context || {})}

Provide enrichment data in this JSON format:
{
  "travelPersona": "Brief persona description",
  "tripType": "Type of trip (leisure, business, adventure, etc.)",
  "decisionStage": "research|planning|ready-to-book|booked",
  "estimatedValue": estimated trip value in USD,
  "recommendations": {
    "tours": ["Recommended tour 1", "Recommended tour 2"],
    "destinations": ["Alt destination 1", "Alt destination 2"],
    "activities": ["Activity 1", "Activity 2"],
    "accommodations": ["Hotel type 1", "Hotel type 2"]
  },
  "engagementStrategy": {
    "nextBestAction": "What the sales team should do next",
    "personalizedMessage": "Personalized message to send to lead",
    "followUpTiming": "When to follow up (e.g., within 24 hours)",
    "channelPreference": "email|sms|phone"
  },
  "insights": {
    "budgetTier": "budget|mid-range|luxury",
    "groupType": "solo|couple|family|group",
    "travelStyle": ["Style 1", "Style 2"],
    "specialNeeds": ["Need 1", "Need 2"]
  },
  "scoringFactors": {
    "engagementScore": score 0-100,
    "readinessScore": score 0-100,
    "valueScore": score 0-100,
    "fitScore": score 0-100
  }
}`

    // Call OpenAI for enrichment
    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.6,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    })

    const enrichedData = JSON.parse(completion.data.choices[0].message?.content || '{}') as EnrichedLeadData

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Update lead with enriched data
    const { error: updateError } = await supabase
      .from('leads_enhanced')
      .update({
        context: {
          ...leadData.context,
          enrichment: enrichedData,
          enrichedAt: new Date().toISOString()
        },
        score: Math.round(
          (enrichedData.scoringFactors.engagementScore +
           enrichedData.scoringFactors.readinessScore +
           enrichedData.scoringFactors.valueScore +
           enrichedData.scoringFactors.fitScore) / 4
        ),
        tags: generateTags(enrichedData)
      })
      .eq('id', leadId)

    if (updateError) {
      console.error('Error updating lead:', updateError)
    }

    // Log enrichment activity
    const { error: activityError } = await supabase
      .from('lead_activities')
      .insert({
        leadId,
        type: 'enrichment',
        description: 'Lead enriched with AI insights',
        metadata: {
          persona: enrichedData.travelPersona,
          stage: enrichedData.decisionStage,
          value: enrichedData.estimatedValue
        },
        performedBy: 'ai-enrichment-system'
      })

    if (activityError) {
      console.error('Error logging activity:', activityError)
    }

    // Trigger webhooks if high-value lead
    if (enrichedData.estimatedValue > 5000 || enrichedData.scoringFactors.readinessScore > 80) {
      await triggerHighValueLeadWebhook(leadId, enrichedData)
    }

    return new Response(
      JSON.stringify({
        success: true,
        enrichment: enrichedData,
        leadId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error enriching lead:', error)
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

function generateTags(enrichedData: EnrichedLeadData): string[] {
  const tags: string[] = []
  
  // Add persona tag
  tags.push(`persona:${enrichedData.travelPersona.toLowerCase().replace(/\s+/g, '-')}`)
  
  // Add stage tag
  tags.push(`stage:${enrichedData.decisionStage}`)
  
  // Add budget tier
  tags.push(`budget:${enrichedData.insights.budgetTier}`)
  
  // Add group type
  tags.push(`group:${enrichedData.insights.groupType}`)
  
  // Add travel styles
  enrichedData.insights.travelStyle.forEach(style => {
    tags.push(`style:${style.toLowerCase().replace(/\s+/g, '-')}`)
  })
  
  // Add value tier
  if (enrichedData.estimatedValue > 10000) {
    tags.push('tier:premium')
  } else if (enrichedData.estimatedValue > 5000) {
    tags.push('tier:high-value')
  } else if (enrichedData.estimatedValue > 2000) {
    tags.push('tier:mid-value')
  } else {
    tags.push('tier:standard')
  }
  
  // Add readiness
  if (enrichedData.scoringFactors.readinessScore > 80) {
    tags.push('hot-lead')
  } else if (enrichedData.scoringFactors.readinessScore > 60) {
    tags.push('warm-lead')
  }
  
  return tags
}

async function triggerHighValueLeadWebhook(leadId: string, enrichedData: EnrichedLeadData) {
  const webhookUrl = Deno.env.get('HIGH_VALUE_LEAD_WEBHOOK_URL')
  if (!webhookUrl) return
  
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'high_value_lead_identified',
        leadId,
        estimatedValue: enrichedData.estimatedValue,
        readinessScore: enrichedData.scoringFactors.readinessScore,
        nextAction: enrichedData.engagementStrategy.nextBestAction,
        timestamp: new Date().toISOString()
      })
    })
  } catch (error) {
    console.error('Webhook error:', error)
  }
}