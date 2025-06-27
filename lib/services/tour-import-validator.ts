import { z } from 'zod'

// Define the required fields for a complete tour
export const RequiredTourFieldsSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(50), // At least 50 chars for quality
  destination: z.string().min(1),
  duration: z.string().min(1),
  price: z.object({
    amount: z.number().positive(),
    currency: z.string().length(3)
  }),
  images: z.array(z.string().url()).min(1), // At least one image
  highlights: z.array(z.string()).min(3), // At least 3 highlights
  included: z.array(z.string()).min(2), // At least 2 inclusions
  categories: z.array(z.string()).min(1), // At least one category
})

// Define optional but recommended fields
export const RecommendedTourFieldsSchema = z.object({
  shortDescription: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  googlePlaceId: z.string().optional(),
  excluded: z.array(z.string()).optional(),
  itinerary: z.array(z.object({
    day: z.number(),
    title: z.string(),
    description: z.string(),
    activities: z.array(z.string())
  })).optional(),
  difficulty: z.string().optional(),
  groupSize: z.object({
    min: z.number(),
    max: z.number()
  }).optional(),
  languages: z.array(z.string()).optional(),
  startingPoint: z.string().optional(),
  endingPoint: z.string().optional(),
  cancellationPolicy: z.string().optional(),
  healthAndSafety: z.string().optional(),
  accessibility: z.string().optional(),
  meetingInstructions: z.string().optional()
})

// Complete tour schema
export const CompleteTourSchema = RequiredTourFieldsSchema.merge(RecommendedTourFieldsSchema)

export interface ImportQualityReport {
  score: number // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor'
  missingRequired: string[]
  missingRecommended: string[]
  warnings: string[]
  suggestions: string[]
  fieldScores: Record<string, number>
}

export class TourImportValidator {
  /**
   * Validate tour data and generate quality report
   */
  static validateTourData(data: any): ImportQualityReport {
    const report: ImportQualityReport = {
      score: 0,
      status: 'poor',
      missingRequired: [],
      missingRecommended: [],
      warnings: [],
      suggestions: [],
      fieldScores: {}
    }

    // Check required fields
    const requiredValidation = RequiredTourFieldsSchema.safeParse(data)
    if (!requiredValidation.success) {
      const errors = requiredValidation.error.flatten()
      report.missingRequired = Object.keys(errors.fieldErrors)
    }

    // Check recommended fields
    const recommendedFields = [
      'shortDescription',
      'coordinates',
      'googlePlaceId',
      'excluded',
      'itinerary',
      'difficulty',
      'groupSize',
      'languages',
      'startingPoint',
      'endingPoint',
      'cancellationPolicy',
      'healthAndSafety',
      'accessibility',
      'meetingInstructions'
    ]

    recommendedFields.forEach(field => {
      if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
        report.missingRecommended.push(field)
      }
    })

    // Calculate field quality scores
    report.fieldScores = this.calculateFieldScores(data)

    // Calculate overall score
    const requiredScore = report.missingRequired.length === 0 ? 50 : 
                         (10 - report.missingRequired.length) * 5
    const recommendedScore = (recommendedFields.length - report.missingRecommended.length) / 
                           recommendedFields.length * 30
    const qualityScore = Object.values(report.fieldScores).reduce((a, b) => a + b, 0) / 
                        Object.keys(report.fieldScores).length * 20

    report.score = Math.round(Math.max(0, Math.min(100, requiredScore + recommendedScore + qualityScore)))

    // Determine status
    if (report.score >= 90) report.status = 'excellent'
    else if (report.score >= 75) report.status = 'good'
    else if (report.score >= 60) report.status = 'fair'
    else report.status = 'poor'

    // Generate warnings and suggestions
    report.warnings = this.generateWarnings(data, report)
    report.suggestions = this.generateSuggestions(data, report)

    return report
  }

  /**
   * Calculate quality scores for individual fields
   */
  private static calculateFieldScores(data: any): Record<string, number> {
    const scores: Record<string, number> = {}

    // Name quality (length and keywords)
    if (data.name) {
      const nameLength = data.name.length
      scores.name = nameLength >= 10 && nameLength <= 100 ? 100 : 
                    nameLength < 10 ? 50 : 75
    }

    // Description quality (length and structure)
    if (data.description) {
      const descLength = data.description.length
      const hasParagraphs = data.description.includes('\n\n') || data.description.includes('<p>')
      scores.description = descLength >= 200 ? 100 : 
                          descLength >= 100 ? 75 : 
                          descLength >= 50 ? 50 : 25
      if (hasParagraphs) scores.description = Math.min(100, scores.description + 10)
    }

    // Image quality (count and URLs)
    if (data.images && Array.isArray(data.images)) {
      const validImages = data.images.filter((img: string) => 
        img.startsWith('http') || img.startsWith('data:')
      )
      scores.images = validImages.length >= 5 ? 100 :
                     validImages.length >= 3 ? 80 :
                     validImages.length >= 1 ? 60 : 0
    }

    // Highlights quality
    if (data.highlights && Array.isArray(data.highlights)) {
      const avgLength = data.highlights.reduce((sum: number, h: string) => 
        sum + h.length, 0) / data.highlights.length
      scores.highlights = data.highlights.length >= 5 && avgLength >= 20 ? 100 :
                         data.highlights.length >= 3 ? 75 : 50
    }

    // Price completeness
    if (data.price) {
      scores.price = data.price.amount && data.price.currency ? 100 : 50
    }

    // Itinerary quality
    if (data.itinerary && Array.isArray(data.itinerary)) {
      const hasDetailedDays = data.itinerary.every((day: any) => 
        day.title && day.description && day.activities?.length > 0
      )
      scores.itinerary = hasDetailedDays ? 100 : 
                        data.itinerary.length > 0 ? 75 : 0
    }

    return scores
  }

  /**
   * Generate warnings based on data quality issues
   */
  private static generateWarnings(data: any, report: ImportQualityReport): string[] {
    const warnings: string[] = []

    // Check for placeholder or low-quality content
    if (data.description && data.description.includes('Lorem ipsum')) {
      warnings.push('Description contains placeholder text')
    }

    if (data.price?.amount === 0) {
      warnings.push('Tour price is set to 0')
    }

    if (data.images?.some((img: string) => img.includes('placeholder'))) {
      warnings.push('Images contain placeholder URLs')
    }

    if (report.missingRequired.length > 0) {
      warnings.push(`Missing ${report.missingRequired.length} required fields`)
    }

    if (!data.coordinates && !data.googlePlaceId) {
      warnings.push('No location coordinates or Google Place ID provided')
    }

    return warnings
  }

  /**
   * Generate improvement suggestions
   */
  private static generateSuggestions(data: any, report: ImportQualityReport): string[] {
    const suggestions: string[] = []

    if (report.fieldScores.description < 75) {
      suggestions.push('Expand description to at least 200 characters with detailed information')
    }

    if (report.fieldScores.images < 80) {
      suggestions.push('Add at least 3-5 high-quality images')
    }

    if (!data.itinerary || data.itinerary.length === 0) {
      suggestions.push('Add a detailed day-by-day itinerary')
    }

    if (!data.cancellationPolicy) {
      suggestions.push('Add a clear cancellation policy')
    }

    if (!data.groupSize) {
      suggestions.push('Specify minimum and maximum group sizes')
    }

    if (!data.languages || data.languages.length === 0) {
      suggestions.push('List available languages for the tour')
    }

    if (report.score < 90 && report.missingRecommended.length > 3) {
      suggestions.push('Complete recommended fields to improve tour listing quality')
    }

    return suggestions
  }

  /**
   * Compare import quality between two sources (e.g., URL vs Document)
   */
  static compareImportQuality(
    urlData: any, 
    documentData: any
  ): {
    urlReport: ImportQualityReport,
    documentReport: ImportQualityReport,
    recommendation: 'url' | 'document' | 'combine',
    comparisonNotes: string[]
  } {
    const urlReport = this.validateTourData(urlData)
    const documentReport = this.validateTourData(documentData)
    const comparisonNotes: string[] = []

    // Compare scores
    if (Math.abs(urlReport.score - documentReport.score) < 10) {
      comparisonNotes.push('Both import methods produce similar quality data')
    } else if (urlReport.score > documentReport.score) {
      comparisonNotes.push(`URL import is ${urlReport.score - documentReport.score}% better`)
    } else {
      comparisonNotes.push(`Document import is ${documentReport.score - urlReport.score}% better`)
    }

    // Check for complementary data
    const urlHasFields = new Set(Object.keys(urlData).filter(k => urlData[k]))
    const docHasFields = new Set(Object.keys(documentData).filter(k => documentData[k]))
    const uniqueToUrl = [...urlHasFields].filter(f => !docHasFields.has(f))
    const uniqueToDoc = [...docHasFields].filter(f => !urlHasFields.has(f))

    if (uniqueToUrl.length > 0 || uniqueToDoc.length > 0) {
      comparisonNotes.push('Each method provides unique data that could be combined')
    }

    // Determine recommendation
    let recommendation: 'url' | 'document' | 'combine' = 'url'
    if (urlReport.score >= 90 && documentReport.score >= 90) {
      recommendation = 'url' // Both excellent, prefer URL for automation
    } else if (urlReport.score < 60 && documentReport.score >= 75) {
      recommendation = 'document'
    } else if ((uniqueToUrl.length > 2 || uniqueToDoc.length > 2) && 
               Math.min(urlReport.score, documentReport.score) >= 60) {
      recommendation = 'combine'
    } else if (urlReport.score > documentReport.score) {
      recommendation = 'url'
    } else {
      recommendation = 'document'
    }

    return {
      urlReport,
      documentReport,
      recommendation,
      comparisonNotes
    }
  }

  /**
   * Merge data from multiple sources for best quality
   */
  static mergeImportData(primary: any, secondary: any): any {
    const merged = { ...primary }

    // Merge arrays by combining unique values
    const arrayFields = ['images', 'highlights', 'included', 'excluded', 'languages', 'categories']
    arrayFields.forEach(field => {
      if (primary[field] && secondary[field]) {
        const combined = [...(primary[field] || []), ...(secondary[field] || [])]
        merged[field] = [...new Set(combined)] // Remove duplicates
      } else if (secondary[field] && !primary[field]) {
        merged[field] = secondary[field]
      }
    })

    // Use longer descriptions
    if (secondary.description && (!primary.description || 
        secondary.description.length > primary.description.length)) {
      merged.description = secondary.description
    }

    // Fill missing fields from secondary
    Object.keys(secondary).forEach(key => {
      if (!merged[key] && secondary[key]) {
        merged[key] = secondary[key]
      }
    })

    return merged
  }
}