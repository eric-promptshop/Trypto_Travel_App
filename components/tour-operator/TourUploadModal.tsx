"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Upload, FileText, Image, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { ExtractedTourData } from '@/lib/services/tour-onboarding-service'
import { useTours } from '@/src/presentation/hooks/useTours'
import { useFeatureFlag } from '@/lib/feature-flags'

interface TourUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onTourCreated: () => void
}

interface UploadedFile {
  file: File
  status: 'pending' | 'processing' | 'success' | 'error'
  extractedData?: ExtractedTourData
  qualityReport?: {
    score: number
    status: 'excellent' | 'good' | 'fair' | 'poor'
    missingRequired: string[]
    missingRecommended: string[]
    warnings: string[]
    suggestions: string[]
  }
  error?: string
}

export default function TourUploadModal({ isOpen, onClose, onTourCreated }: TourUploadModalProps) {
  const useNewTourService = useFeatureFlag('USE_NEW_TOUR_SERVICE')
  const { createTour } = useTours()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<'upload' | 'review' | 'complete'>('upload')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      status: 'pending' as const
    }))
    setUploadedFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'text/plain': ['.txt']
    },
    maxSize: 10485760 // 10MB
  })

  const processFiles = async () => {
    setIsProcessing(true)
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      const uploadedFile = uploadedFiles[i]
      if (uploadedFile.status !== 'pending') continue

      try {
        // Update status to processing
        setUploadedFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'processing' } : f
        ))

        // Convert file to base64 or text
        const formData = new FormData()
        formData.append('file', uploadedFile.file)

        // Call API to process file
        const response = await fetch('/api/tour-operator/tours/extract', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error('Failed to process file')
        }

        const { tourData, qualityReport } = await response.json()

        // Update with extracted data and quality report
        setUploadedFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'success', extractedData: tourData, qualityReport } : f
        ))
      } catch (error) {
        console.error('Error processing file:', error)
        setUploadedFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Processing failed' } : f
        ))
      }
    }

    setIsProcessing(false)
    setCurrentStep('review')
  }

  const createTours = async () => {
    setIsProcessing(true)
    
    const successfulExtractions = uploadedFiles.filter(f => f.status === 'success' && f.extractedData)
    
    for (const extraction of successfulExtractions) {
      try {
        if (useNewTourService && extraction.extractedData) {
          // Use new service
          await createTour({
            title: extraction.extractedData.name,
            description: extraction.extractedData.description || '',
            duration: parseInt(extraction.extractedData.duration?.replace(/\D/g, '') || '1'),
            price: {
              amount: extraction.extractedData.price?.amount || 0,
              currency: extraction.extractedData.price?.currency || 'USD'
            },
            destinations: [extraction.extractedData.destination],
            activities: extraction.extractedData.activities || [],
            images: extraction.extractedData.images?.map(img => ({
              url: img,
              alt: extraction.extractedData.name
            })) || [],
            included: extraction.extractedData.inclusions,
            excluded: extraction.extractedData.exclusions,
            languages: extraction.extractedData.languages
          })
        } else {
          // Legacy implementation
          const response = await fetch('/api/tour-operator/tours', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tourData: extraction.extractedData })
          })

          if (!response.ok) {
            throw new Error('Failed to create tour')
          }
        }
      } catch (error) {
        console.error('Error creating tour:', error)
        toast.error(`Failed to create tour: ${extraction.extractedData?.name}`)
      }
    }

    setIsProcessing(false)
    setCurrentStep('complete')
    toast.success(`Successfully created ${successfulExtractions.length} tours!`)
    
    setTimeout(() => {
      onTourCreated()
      handleClose()
    }, 2000)
  }

  const handleClose = () => {
    setUploadedFiles([])
    setCurrentStep('upload')
    setIsProcessing(false)
    onClose()
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Tour Documents</DialogTitle>
          <DialogDescription>
            Upload PDFs, images, or documents containing tour information. Our AI will automatically extract and organize the details.
          </DialogDescription>
        </DialogHeader>

        {currentStep === 'upload' && (
          <>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to select'}
              </p>
              <p className="text-xs text-gray-500">
                Supports PDF, Word docs, images (max 10MB)
              </p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</h4>
                {uploadedFiles.map((uploadedFile, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getFileIcon(uploadedFile.file)}
                      <div>
                        <p className="text-sm font-medium">{uploadedFile.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(uploadedFile.status)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {currentStep === 'review' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Extracted Tour Information</h4>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {uploadedFiles.map((uploadedFile, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-sm">{uploadedFile.file.name}</h5>
                    {getStatusIcon(uploadedFile.status)}
                  </div>
                  
                  {uploadedFile.status === 'success' && uploadedFile.extractedData && (
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Tour Name:</span> {uploadedFile.extractedData.name}
                      </div>
                      <div>
                        <span className="font-medium">Destination:</span> {uploadedFile.extractedData.destination}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {uploadedFile.extractedData.duration}
                      </div>
                      {uploadedFile.extractedData.price && (
                        <div>
                          <span className="font-medium">Price:</span> {uploadedFile.extractedData.price.currency} {uploadedFile.extractedData.price.amount}
                        </div>
                      )}
                      
                      {uploadedFile.qualityReport && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Quality Score:</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${
                                uploadedFile.qualityReport.score >= 90 ? 'text-green-600' :
                                uploadedFile.qualityReport.score >= 75 ? 'text-blue-600' :
                                uploadedFile.qualityReport.score >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {uploadedFile.qualityReport.score}%
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                uploadedFile.qualityReport.status === 'excellent' ? 'bg-green-100 text-green-800' :
                                uploadedFile.qualityReport.status === 'good' ? 'bg-blue-100 text-blue-800' :
                                uploadedFile.qualityReport.status === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {uploadedFile.qualityReport.status}
                              </span>
                            </div>
                          </div>
                          
                          {uploadedFile.qualityReport.warnings.length > 0 && (
                            <div className="text-xs text-yellow-600 mb-2">
                              ⚠️ {uploadedFile.qualityReport.warnings[0]}
                            </div>
                          )}
                          
                          {uploadedFile.qualityReport.suggestions.length > 0 && (
                            <div className="text-xs text-gray-600">
                              💡 {uploadedFile.qualityReport.suggestions[0]}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {uploadedFile.status === 'error' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{uploadedFile.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2">Tours Created Successfully!</h3>
            <p className="text-gray-600">Your tours have been added to your dashboard.</p>
          </div>
        )}

        <DialogFooter>
          {currentStep === 'upload' && (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button 
                onClick={processFiles} 
                disabled={uploadedFiles.length === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Process ${uploadedFiles.length} File${uploadedFiles.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </>
          )}
          
          {currentStep === 'review' && (
            <>
              <Button variant="outline" onClick={() => setCurrentStep('upload')}>Back</Button>
              <Button 
                onClick={createTours}
                disabled={isProcessing || uploadedFiles.filter(f => f.status === 'success').length === 0}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Tours...
                  </>
                ) : (
                  `Create ${uploadedFiles.filter(f => f.status === 'success').length} Tours`
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