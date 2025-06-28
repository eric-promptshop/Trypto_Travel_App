"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Globe, Loader2, CheckCircle2, AlertCircle, Link } from 'lucide-react'
import { ExtractedTourData } from '@/lib/services/tour-onboarding-service'
import { useTours } from '@/src/presentation/hooks/useTours'
import { useFeatureFlag } from '@/lib/feature-flags'

interface TourUrlImportModalProps {
  isOpen: boolean
  onClose: () => void
  onTourCreated: () => void
}

export default function TourUrlImportModal({ isOpen, onClose, onTourCreated }: TourUrlImportModalProps) {
  const useNewTourService = useFeatureFlag('USE_NEW_TOUR_SERVICE')
  const { createTour } = useTours()
  const [url, setUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedTourData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<'input' | 'review' | 'complete'>('input')

  const handleExtractFromUrl = async () => {
    if (!url.trim()) {
      toast.error('Please enter a valid URL')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Validate URL format
      new URL(url)

      // Call API to scrape and extract tour data from URL
      const response = await fetch('/api/tour-operator/tours/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to extract tour data from URL')
      }

      const { tourData } = await response.json()
      setExtractedData(tourData)
      setCurrentStep('review')
    } catch (error) {
      console.error('Error extracting tour from URL:', error)
      if (error instanceof TypeError) {
        setError('Invalid URL format. Please enter a valid URL.')
      } else {
        setError(error instanceof Error ? error.message : 'Failed to extract tour data')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateTour = async () => {
    if (!extractedData) return

    setIsProcessing(true)

    try {
      if (useNewTourService) {
        // Use new service
        await createTour({
          title: extractedData.name,
          description: extractedData.description || '',
          duration: parseInt(extractedData.duration?.replace(/\D/g, '') || '1'),
          price: {
            amount: extractedData.price?.amount || 0,
            currency: extractedData.price?.currency || 'USD'
          },
          destinations: [extractedData.destination],
          activities: extractedData.activities || [],
          images: extractedData.images?.map(img => ({
            url: img,
            alt: extractedData.name
          })) || [],
          included: extractedData.inclusions,
          excluded: extractedData.exclusions,
          languages: extractedData.languages
        })
      } else {
        // Legacy implementation
        const response = await fetch('/api/tour-operator/tours', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tourData: extractedData })
        })

        if (!response.ok) {
          throw new Error('Failed to create tour')
        }
      }

      setCurrentStep('complete')
      toast.success('Tour created successfully!')
      
      setTimeout(() => {
        onTourCreated()
        handleClose()
      }, 2000)
    } catch (error) {
      console.error('Error creating tour:', error)
      toast.error('Failed to create tour')
      setError(error instanceof Error ? error.message : 'Failed to create tour')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setUrl('')
    setExtractedData(null)
    setError(null)
    setCurrentStep('input')
    setIsProcessing(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Tour from URL</DialogTitle>
          <DialogDescription>
            Enter a URL to a tour page and our AI will automatically extract the tour information.
          </DialogDescription>
        </DialogHeader>

        {currentStep === 'input' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Tour URL</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com/tours/amazing-paris-tour"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isProcessing) {
                        handleExtractFromUrl()
                      }
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Supports tour pages from major travel websites and tour operators
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-2">Supported Information</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Tour name and description</li>
                <li>• Destination and itinerary</li>
                <li>• Duration and dates</li>
                <li>• Pricing and inclusions</li>
                <li>• Images and highlights</li>
              </ul>
            </div>
          </div>
        )}

        {currentStep === 'review' && extractedData && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Extracted Tour Information</h4>
            <div className="border rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
              <div>
                <span className="font-medium text-sm">Tour Name:</span>
                <p className="text-sm mt-1">{extractedData.name}</p>
              </div>
              
              <div>
                <span className="font-medium text-sm">Destination:</span>
                <p className="text-sm mt-1">{extractedData.destination}</p>
              </div>
              
              <div>
                <span className="font-medium text-sm">Duration:</span>
                <p className="text-sm mt-1">{extractedData.duration}</p>
              </div>
              
              {extractedData.description && (
                <div>
                  <span className="font-medium text-sm">Description:</span>
                  <p className="text-sm mt-1 text-gray-600">{extractedData.description}</p>
                </div>
              )}
              
              {extractedData.price && (
                <div>
                  <span className="font-medium text-sm">Price:</span>
                  <p className="text-sm mt-1">
                    {extractedData.price.currency} {extractedData.price.amount}
                    {extractedData.price.perPerson && ' per person'}
                  </p>
                </div>
              )}
              
              {extractedData.highlights && extractedData.highlights.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Highlights:</span>
                  <ul className="text-sm mt-1 text-gray-600 list-disc list-inside">
                    {extractedData.highlights.map((highlight, idx) => (
                      <li key={idx}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2">Tour Imported Successfully!</h3>
            <p className="text-gray-600">Your tour has been added to your dashboard.</p>
          </div>
        )}

        <DialogFooter>
          {currentStep === 'input' && (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button 
                onClick={handleExtractFromUrl} 
                disabled={!url.trim() || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    Extract Tour Data
                  </>
                )}
              </Button>
            </>
          )}
          
          {currentStep === 'review' && (
            <>
              <Button variant="outline" onClick={() => setCurrentStep('input')}>Back</Button>
              <Button 
                onClick={handleCreateTour}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Tour...
                  </>
                ) : (
                  'Create Tour'
                )}
              </Button>
            </>
          )}
          
          {currentStep === 'complete' && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}