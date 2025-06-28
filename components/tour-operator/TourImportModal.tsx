"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { 
  Globe, 
  Link2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Search
} from 'lucide-react'
import { useTours } from '@/src/presentation/hooks/useTours'
import { useFeatureFlag } from '@/lib/feature-flags'

interface TourImportModalProps {
  isOpen: boolean
  onClose: () => void
  onTourImported: () => void
}

interface ImportResult {
  success: boolean
  tourName?: string
  message?: string
}

export default function TourImportModal({ isOpen, onClose, onTourImported }: TourImportModalProps) {
  const useNewTourService = useFeatureFlag('USE_NEW_TOUR_SERVICE')
  const { createTour } = useTours()
  const [url, setUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importResults, setImportResults] = useState<ImportResult[]>([])
  const [activeTab, setActiveTab] = useState<'url' | 'batch'>('url')

  // Popular tour operator sites for quick import
  const popularSites = [
    { name: 'GetYourGuide', url: 'https://www.getyourguide.com/', icon: '🎯' },
    { name: 'Viator', url: 'https://www.viator.com/', icon: '🌍' },
    { name: 'TripAdvisor', url: 'https://www.tripadvisor.com/', icon: '📍' },
    { name: 'Booking.com', url: 'https://www.booking.com/', icon: '🏨' },
  ]

  const handleUrlImport = async () => {
    if (!url.trim()) {
      toast.error('Please enter a valid URL')
      return
    }

    setIsImporting(true)
    setImportResults([])

    try {
      const response = await fetch('/api/tour-operator/tours/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Import failed')
      }

      setImportResults([{
        success: true,
        tourName: result.tour.name,
        message: 'Tour imported successfully!'
      }])

      toast.success(`Tour "${result.tour.name}" imported successfully!`)
      
      setTimeout(() => {
        onTourImported()
        handleClose()
      }, 2000)
    } catch (error) {
      console.error('Import error:', error)
      setImportResults([{
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import tour'
      }])
      toast.error('Failed to import tour from URL')
    } finally {
      setIsImporting(false)
    }
  }

  const handleBatchImport = async (urls: string[]) => {
    setIsImporting(true)
    setImportResults([])

    const results: ImportResult[] = []

    for (const importUrl of urls) {
      try {
        const response = await fetch('/api/tour-operator/tours/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: importUrl.trim() })
        })

        const result = await response.json()

        if (response.ok) {
          results.push({
            success: true,
            tourName: result.tour.name,
            message: `Imported: ${result.tour.name}`
          })
        } else {
          results.push({
            success: false,
            message: `Failed: ${importUrl}`
          })
        }
      } catch (error) {
        results.push({
          success: false,
          message: `Error: ${importUrl}`
        })
      }

      setImportResults([...results])
    }

    setIsImporting(false)
    
    const successCount = results.filter(r => r.success).length
    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} tours!`)
      setTimeout(() => {
        onTourImported()
        handleClose()
      }, 2000)
    }
  }

  const handleClose = () => {
    setUrl('')
    setImportResults([])
    setActiveTab('url')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Tours from Web</DialogTitle>
          <DialogDescription>
            Import tour details directly from popular tour operator websites
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'url' | 'batch')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">Single URL</TabsTrigger>
            <TabsTrigger value="batch">Batch Import</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Tour URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  type="url"
                  placeholder="https://www.example.com/tour/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleUrlImport}
                  disabled={isImporting || !url.trim()}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Import
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Popular Tour Sites</Label>
              <div className="grid grid-cols-2 gap-2">
                {popularSites.map((site) => (
                  <Button
                    key={site.name}
                    variant="outline"
                    className="justify-start"
                    onClick={() => setUrl(site.url)}
                  >
                    <span className="mr-2">{site.icon}</span>
                    {site.name}
                  </Button>
                ))}
              </div>
            </div>

            {importResults.length > 0 && (
              <Alert variant={importResults[0].success ? "default" : "destructive"}>
                {importResults[0].success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {importResults[0].message}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="batch" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="urls">Tour URLs (one per line)</Label>
              <textarea
                id="urls"
                className="w-full h-32 p-3 border rounded-md resize-none"
                placeholder="https://www.example.com/tour1
https://www.example.com/tour2
https://www.example.com/tour3"
                disabled={isImporting}
              />
            </div>

            <Button
              onClick={() => {
                const textarea = document.getElementById('urls') as HTMLTextAreaElement
                const urls = textarea.value.split('\n').filter(u => u.trim())
                if (urls.length > 0) {
                  handleBatchImport(urls)
                } else {
                  toast.error('Please enter at least one URL')
                }
              }}
              disabled={isImporting}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Import All
                </>
              )}
            </Button>

            {importResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {importResults.map((result, index) => (
                  <Alert 
                    key={index} 
                    variant={result.success ? "default" : "destructive"}
                    className="py-2"
                  >
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription className="text-sm">
                      {result.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}