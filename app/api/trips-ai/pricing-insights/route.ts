import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

interface PricingInsight {
  type: 'warning' | 'tip' | 'savings'
  title: string
  description: string
  potentialSavings?: number
  alternativeOptions?: string[]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { selectedItems, tripDates, travelers, currentPricing, currency } = body

    if (!selectedItems) {
      return NextResponse.json(
        { error: 'Selected items are required' },
        { status: 400 }
      )
    }

    // Try to get AI insights
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured')
      }

      const totalItems = 
        (selectedItems.accommodations?.length || 0) +
        (selectedItems.activities?.length || 0) +
        (selectedItems.transportation?.length || 0)

      if (totalItems === 0) {
        return NextResponse.json({ insights: [] })
      }

      const prompt = `Analyze the following travel selections and provide pricing insights:

Trip Details:
- Dates: ${new Date(tripDates.startDate).toLocaleDateString()} to ${new Date(tripDates.endDate).toLocaleDateString()}
- Travelers: ${travelers.adults} adults, ${travelers.children} children
- Current total price: ${currency}${currentPricing}

Selected Items:
- Accommodations: ${selectedItems.accommodations?.map((a: any) => 
    `${a.title || a.name} (${currency}${a.estimatedCost?.amount || a.pricing?.adult || 0}/night)`
  ).join(', ') || 'None'}
- Activities: ${selectedItems.activities?.map((a: any) => 
    `${a.title || a.name} (${currency}${a.estimatedCost?.amount || 0})`
  ).join(', ') || 'None'}
- Transportation: ${selectedItems.transportation?.map((t: any) => 
    `${t.title || t.type} (${currency}${t.estimatedCost?.amount || 0})`
  ).join(', ') || 'None'}

Provide 2-3 actionable insights in JSON format:
{
  "insights": [
    {
      "type": "warning|tip|savings",
      "title": "Brief title",
      "description": "Detailed explanation",
      "potentialSavings": number (optional),
      "alternativeOptions": ["option1", "option2"] (optional)
    }
  ]
}

Focus on:
1. Seasonal pricing alerts
2. Bundle opportunities
3. Alternative options for expensive items
4. Timing optimization
5. Hidden costs to consider`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a travel pricing expert. Provide practical, actionable insights to help travelers optimize their budget without compromising experience quality.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 600
      })

      const responseText = completion.choices[0]?.message?.content || '{}'
      const aiInsights = JSON.parse(responseText)

      return NextResponse.json({
        insights: aiInsights.insights || [],
        source: 'ai'
      })

    } catch (aiError) {
      console.error('AI pricing insights error:', aiError)
      // Fall back to rule-based insights
      return generateRuleBasedInsights(selectedItems, tripDates, travelers, currentPricing, currency)
    }

  } catch (error) {
    console.error('Pricing insights API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate pricing insights' },
      { status: 500 }
    )
  }
}

function generateRuleBasedInsights(
  selectedItems: any,
  tripDates: any,
  travelers: any,
  currentPricing: number,
  currency: string
): NextResponse {
  const insights: PricingInsight[] = []

  // Check date patterns
  const startDate = new Date(tripDates.startDate)
  const month = startDate.getMonth()
  const dayOfWeek = startDate.getDay()

  // Weekend premium check
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    insights.push({
      type: 'tip',
      title: 'Weekend Premium Detected',
      description: 'Starting your trip mid-week (Tuesday-Thursday) typically saves 15-20% on accommodations and flights.',
      potentialSavings: currentPricing * 0.15
    })
  }

  // High season check
  if (month >= 5 && month <= 7) {
    insights.push({
      type: 'warning',
      title: 'Peak Summer Season',
      description: 'You\'re traveling during high season. Consider shoulder season (April/May or September/October) for better rates and fewer crowds.',
      potentialSavings: currentPricing * 0.25
    })
  }

  // Check for expensive accommodations
  const expensiveAccommodations = selectedItems.accommodations?.filter((a: any) => {
    const price = a.estimatedCost?.amount || a.pricing?.adult || 0
    return price > 200
  })

  if (expensiveAccommodations?.length > 0) {
    insights.push({
      type: 'tip',
      title: 'Premium Accommodation Alert',
      description: 'Consider mixing luxury stays with boutique hotels or well-rated 3-star options to reduce costs by 30-40% while maintaining comfort.',
      potentialSavings: expensiveAccommodations.reduce((sum: number, a: any) => 
        sum + ((a.estimatedCost?.amount || a.pricing?.adult || 0) * 0.35), 0
      ) * travelers.adults,
      alternativeOptions: ['Boutique Hotels', 'Serviced Apartments', 'Premium Hostels']
    })
  }

  // Activity bundling opportunity
  if (selectedItems.activities?.length >= 3) {
    insights.push({
      type: 'savings',
      title: 'Activity Bundle Opportunity',
      description: 'Many tour operators offer package deals for 3+ activities. Contact providers directly or look for combo tickets to save 15-25%.',
      potentialSavings: selectedItems.activities.reduce((sum: number, a: any) => 
        sum + (a.estimatedCost?.amount || 0), 0
      ) * 0.20
    })
  }

  // Transportation optimization
  if (selectedItems.transportation?.length > 0 && selectedItems.activities?.length > 2) {
    insights.push({
      type: 'tip',
      title: 'Consider Public Transit Passes',
      description: 'With multiple activities planned, a weekly transit pass might save 40-60% compared to individual trips or taxis.',
      alternativeOptions: ['Metro Weekly Pass', 'City Tourist Card', 'Bike Rental']
    })
  }

  // Early booking reminder
  const daysUntilTrip = Math.floor((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysUntilTrip < 30 && daysUntilTrip > 0) {
    insights.push({
      type: 'warning',
      title: 'Last-Minute Booking Premium',
      description: 'Booking less than 30 days in advance typically costs 20-30% more. For future trips, book 2-3 months ahead for best rates.',
      potentialSavings: currentPricing * 0.20
    })
  }

  // Limit to top 3 most relevant insights
  return NextResponse.json({
    insights: insights.slice(0, 3),
    source: 'rule-based'
  })
}