"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { useOnboarding } from "@/contexts/onboarding-context"
import {
  Search,
  UploadCloud,
  Edit3,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react"

type ImportStage = "selection" | "scanning" | "scan_results" | "uploading" | "upload_results"

interface Tour {
  id: string
  name: string
  destination: string
  duration: string
  status: "enabled" | "disabled"
}

const initialTours: Tour[] = [
  { id: "1", name: "Inca Trail Discovery", destination: "Peru", duration: "7 Days", status: "enabled" },
  { id: "2", name: "Amazon Rainforest Expedition", destination: "Brazil", duration: "5 Days", status: "enabled" },
  { id: "3", name: "Patagonia Wonders", destination: "Argentina", duration: "10 Days", status: "disabled" },
]

export function ContentImportScreen() {
  const { onboardingData, updateOnboardingData, navigateToNextStep, navigateToPrevStep } = useOnboarding()
  const [stage, setStage] = useState<ImportStage>("selection")
  const [scanProgress, setScanProgress] = useState(0)
  const [scanMessage, setScanMessage] = useState("Initializing scan...")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [fileUploadProgress, setFileUploadProgress] = useState<Record<string, number>>({})
  const [importedTours, setImportedTours] = useState<Tour[]>(onboardingData.contentImport?.tours || [])
  const [selectedTours, setSelectedTours] = useState<string[]>(
    initialTours.filter((t) => t.status === "enabled").map((t) => t.id),
  )

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (stage === "scanning") {
      setScanProgress(0)
      setScanMessage("Initializing website scanner...")
      
      // Get website URL from company profile
      const websiteUrl = onboardingData.companyProfile?.websiteUrl || 'https://example-tours.com'
      
      // Start the real scanning process
      const performScan = async () => {
        try {
          // Update progress messages
          const progressInterval = setInterval(() => {
            setScanProgress((prev) => {
              if (prev < 90) {
                const messages = [
                  "Connecting to website...",
                  "Analyzing page structure...",
                  "Extracting tour information...",
                  "Processing activity data...",
                  "Gathering pricing details...",
                  "Collecting images and descriptions...",
                ]
                const messageIndex = Math.floor(prev / 15)
                setScanMessage(messages[messageIndex] || "Processing...")
                return prev + 5
              }
              return prev
            })
          }, 500)
          
          // Call the actual scanning API
          const response = await fetch('/api/content/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              websiteUrl,
              tenantId: 'default', // TODO: Get from auth context when implemented
              scanDepth: 10, // Scan up to 10 pages
            }),
          })
          
          clearInterval(progressInterval)
          
          if (!response.ok) {
            throw new Error('Scanning failed')
          }
          
          const result = await response.json()
          
          if (result.data?.tours && result.data.tours.length > 0) {
            // Use real scraped data
            setScanProgress(100)
            setScanMessage(`Scan complete! Found ${result.data.tours.length} tours from ${result.data.summary.destinations.length} destinations.`)
            setImportedTours(result.data.tours)
            setStage("scan_results")
          } else {
            // Fallback to mock data if no tours found
            setScanProgress(100)
            setScanMessage("Scan complete! Using sample data.")
            setImportedTours(initialTours)
            setStage("scan_results")
          }
        } catch (error) {
          console.error('Scanning error:', error)
          // On error, use mock data
          setScanProgress(100)
          setScanMessage("Using sample tour data (website scan unavailable).")
          setImportedTours(initialTours)
          setStage("scan_results")
        }
      }
      
      performScan()
    }
    return undefined
  }, [stage, onboardingData.companyProfile?.websiteUrl])

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files)
      setUploadedFiles((prev) => [...prev, ...newFiles])
      setStage("uploading")
      newFiles.forEach((file) => {
        let progress = 0
        const interval = setInterval(() => {
          progress += 10
          setFileUploadProgress((prev) => ({ ...prev, [file.name]: progress }))
          if (progress >= 100) {
            clearInterval(interval)
            // Simulate processing
            setTimeout(() => {
              if (
                uploadedFiles.length + newFiles.length ===
                newFiles.filter((f) => (fileUploadProgress[f.name] || 0) >= 100).length + uploadedFiles.length
              ) {
                // Check if all current uploads are done
                setImportedTours((prev) => [
                  ...prev,
                  ...initialTours.slice(0, 2).map((t) => ({
                    ...t,
                    id: t.id + file.name,
                    name: `${t.name} (from ${file.name.substring(0, 10)})`,
                  })),
                ]) // Mock
                setStage("upload_results")
              }
            }, 500)
          }
        }, 200)
      })
    }
  }

  const toggleTourStatus = (tourId: string) => {
    setImportedTours((prev) =>
      prev.map((tour) =>
        tour.id === tourId ? { ...tour, status: tour.status === "enabled" ? "disabled" : "enabled" } : tour,
      ),
    )
  }

  const toggleSelectAll = (checked: boolean) => {
    const allTourIds = importedTours.map((t) => t.id)
    setSelectedTours(checked ? allTourIds : [])
    setImportedTours((prev) => prev.map((tour) => ({ ...tour, status: checked ? "enabled" : "disabled" })))
  }

  const handleContinue = () => {
    updateOnboardingData({
      contentImport: {
        method: stage.startsWith("scan") ? "scan" : "upload",
        importedToursCount: importedTours.length,
        tours: importedTours,
      },
    })
    navigateToNextStep()
  }

  const renderSelection = () => (
    <div className="grid md:grid-cols-3 gap-6">
      <Card onClick={() => setStage("scanning")} className="cursor-pointer hover:shadow-xl transition-shadow bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-primary-blue">Automatic Website Scan</CardTitle>
            <Badge variant="default" className="bg-accent-orange text-white">
              RECOMMENDED
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="text-center">
          <Search className="w-16 h-16 text-primary-blue mx-auto mb-4" />
          <p className="text-slate-600">
            Let us scan your existing website to automatically import your tour information.
          </p>
        </CardContent>
      </Card>
      <Card
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer hover:shadow-xl transition-shadow bg-white"
      >
        <CardHeader>
          <CardTitle className="text-xl text-primary-blue">Upload Tour Documents</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <UploadCloud className="w-16 h-16 text-primary-blue mx-auto mb-4" />
          <p className="text-slate-600">Upload PDF, Word, or other documents containing your tour details.</p>
          <Input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </CardContent>
      </Card>
      <Card className="bg-slate-50 cursor-not-allowed opacity-70">
        <CardHeader>
          <CardTitle className="text-xl text-slate-500">Manual Entry</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <Edit3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">
            Enter tour information manually. <Badge variant="outline">Coming Soon</Badge>
          </p>
        </CardContent>
      </Card>
    </div>
  )

  const renderScanning = () => (
    <div className="text-center py-10 bg-white rounded-lg shadow-md">
      <div className="relative w-32 h-32 mx-auto mb-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full bg-primary-blue animate-radar-scan"
            style={{ animationDelay: `${i * 0.5}s` }}
          />
        ))}
        <Search className="w-12 h-12 text-accent-orange absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <Loader2 className="w-12 h-12 text-primary-blue mx-auto mb-4 animate-spin" />
      <p className="text-xl font-medium text-primary-blue mb-2">{scanMessage}</p>
      <Progress value={scanProgress} className="w-1/2 mx-auto h-3 [&>div]:bg-accent-orange" />
      <p className="text-sm text-slate-500 mt-2">{scanProgress}% complete</p>
    </div>
  )

  const renderUploading = () => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-medium text-primary-blue mb-4">Uploading Files...</h3>
      {uploadedFiles.map((file) => (
        <div key={file.name} className="mb-3">
          <div className="flex justify-between text-sm text-slate-700 mb-1">
            <span>{file.name}</span>
            <span>{fileUploadProgress[file.name] || 0}%</span>
          </div>
          <Progress value={fileUploadProgress[file.name] || 0} className="h-2 [&>div]:bg-accent-orange" />
        </div>
      ))}
      {uploadedFiles.every((f) => (fileUploadProgress[f.name] || 0) >= 100) && !importedTours.length && (
        <p className="text-center text-primary-blue mt-4">
          <Loader2 className="inline w-5 h-5 animate-spin mr-2" />
          Processing files...
        </p>
      )}
    </div>
  )

  const renderResultsTable = (successMessage: string) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center gap-2 text-success-default mb-4">
        <CheckCircle className="w-6 h-6" />
        <p className="font-medium">{successMessage}</p>
      </div>
      <div className="flex items-center mb-4">
        <Checkbox
          id="selectAllTours"
          checked={selectedTours.length === importedTours.length && importedTours.length > 0}
          onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))}
          className="mr-2"
        />
        <Label htmlFor="selectAllTours" className="text-sm font-medium">
          Select All / Deselect All
        </Label>
      </div>
      <Card className="border-slate-200">
        <Input placeholder="Search tours..." className="m-4 w-[calc(100%-2rem)]" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Tour Name</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Status (Enable/Disable)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {importedTours.map((tour) => (
              <TableRow key={tour.id}>
                <TableCell>
                  <Checkbox checked={tour.status === "enabled"} onCheckedChange={() => toggleTourStatus(tour.id)} />
                </TableCell>
                <TableCell className="font-medium">{tour.name}</TableCell>
                <TableCell>{tour.destination}</TableCell>
                <TableCell>{tour.duration}</TableCell>
                <TableCell className="text-right">
                  <Switch
                    checked={tour.status === "enabled"}
                    onCheckedChange={() => toggleTourStatus(tour.id)}
                    aria-label={`Toggle ${tour.name}`}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {importedTours.length === 0 && <p className="text-center text-slate-500 py-8">No tours imported yet.</p>}
    </div>
  )

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-primary-blue mb-6">Content Import</h2>
      {stage === "selection" && renderSelection()}
      {stage === "scanning" && renderScanning()}
      {stage === "scan_results" && renderResultsTable(scanMessage || "✓ Successfully imported tours from your website.")}
      {stage === "uploading" && renderUploading()}
      {stage === "upload_results" &&
        renderResultsTable(`✓ Successfully processed uploaded files. ${importedTours.length} total tours available.`)}

      {(stage === "scan_results" || stage === "upload_results" || stage === "selection") && (
        <div className="flex justify-between mt-10">
          <Button
            variant="ghost"
            onClick={stage === "selection" ? navigateToPrevStep : () => setStage("selection")}
            className="text-primary-blue hover:bg-blue-50"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={
              (stage === "scan_results" || stage === "upload_results") &&
              importedTours.filter((t) => t.status === "enabled").length === 0
            }
            className="bg-accent-orange hover:bg-orange-600 text-white"
            style={{ backgroundColor: "#ff6b35" }}
          >
            Continue <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
      {(stage === "scan_results" || stage === "upload_results") &&
        importedTours.filter((t) => t.status === "enabled").length === 0 && (
          <p className="text-center text-sm text-amber-600 mt-4">
            <AlertTriangle className="inline w-4 h-4 mr-1" /> Please enable at least one tour to continue.
          </p>
        )}
    </div>
  )
}
