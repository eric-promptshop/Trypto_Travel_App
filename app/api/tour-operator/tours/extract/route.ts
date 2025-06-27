import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { TourOnboardingService } from '@/lib/services/tour-onboarding-service'
import { TourImportValidator } from '@/lib/services/tour-import-validator'
import { PDFParser } from '@/src/parsers/PDFParser'
import { z } from 'zod'

// Schema for file upload validation
const fileUploadSchema = z.object({
  file: z.instanceof(File)
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || session.user.role !== 'TOUR_OPERATOR') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }


    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('[Extract Tour API] Processing file:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    let content = ''
    let extractedData

    // Process based on file type
    if (file.type === 'application/pdf') {
      // Process PDF using existing parser
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      try {
        const pdfParser = new PDFParser()
        const parsedDoc = await pdfParser.parse(buffer)
        content = parsedDoc.rawText
      } catch (pdfError) {
        console.error('[Extract Tour API] PDF parsing error:', pdfError)
        return NextResponse.json(
          { error: 'Failed to parse PDF file' },
          { status: 400 }
        )
      }
      
      extractedData = await TourOnboardingService.extractTourFromDocument(content)
    } else if (file.type.startsWith('image/')) {
      // Process image
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      
      extractedData = await TourOnboardingService.extractTourFromImage(base64)
    } else if (file.type === 'text/plain' || file.type.includes('word')) {
      // Process text or Word documents
      content = await file.text()
      extractedData = await TourOnboardingService.extractTourFromDocument(content)
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      )
    }

    // Validate and enhance the extracted data
    const validatedData = TourOnboardingService.validateAndEnhanceTourData(extractedData)

    // Generate quality report
    const qualityReport = TourImportValidator.validateTourData(validatedData)

    // Generate SEO content
    const seoContent = await TourOnboardingService.generateSEOContent(validatedData)

    console.log('[Extract Tour API] Quality Report:', {
      score: qualityReport.score,
      status: qualityReport.status,
      missingRequired: qualityReport.missingRequired.length,
      missingRecommended: qualityReport.missingRecommended.length
    })

    return NextResponse.json({
      tourData: validatedData,
      seoContent,
      qualityReport,
      metadata: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        extractedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('[Extract Tour API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract tour data' },
      { status: 500 }
    )
  }
}