"use client"

import { useState, useRef, type ChangeEvent } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useOnboarding } from "@/contexts/onboarding-context"
import { ChevronLeft, ChevronRight, UploadCloud, Monitor, Smartphone } from "lucide-react"
import { BrandingPreview } from "@/components/onboarding/preview/branding-preview"
import { MobilePreview } from "@/components/onboarding/preview/mobile-preview"
import { FontLoader } from "@/components/onboarding/font-loader"

const fontOptions = [
  { value: "Inter", label: "Modern (Inter)" },
  { value: "Georgia", label: "Classic (Georgia)" },
  { value: "Open Sans", label: "Friendly (Open Sans)" },
  { value: "Roboto", label: "Professional (Roboto)" },
  { value: "Playfair Display", label: "Elegant (Playfair)" },
  { value: "Montserrat", label: "Clean (Montserrat)" },
]

const colorSwatches = ["#1f5582", "#ff6b35", "#065f46", "#7c3aed", "#db2777", "#ca8a04"]

const presetThemes = [
  { 
    name: "Ocean Blue", 
    primary: "#1f5582", 
    secondary: "#ff6b35",
    description: "Professional and trustworthy"
  },
  { 
    name: "Forest Green", 
    primary: "#065f46", 
    secondary: "#f59e0b",
    description: "Natural and adventurous"
  },
  { 
    name: "Royal Purple", 
    primary: "#7c3aed", 
    secondary: "#ec4899",
    description: "Luxurious and unique"
  },
  { 
    name: "Sunset Orange", 
    primary: "#ea580c", 
    secondary: "#0891b2",
    description: "Warm and energetic"
  },
]

export function BrandingCustomizationScreen() {
  const { onboardingData, updateOnboardingData, navigateToNextStep, navigateToPrevStep } = useOnboarding()

  const [logoUrl, setLogoUrl] = useState<string | undefined>(onboardingData.branding?.logoUrl)
  const [logoFile, setLogoFile] = useState<File | undefined>(onboardingData.branding?.logoFile)
  const [primaryColor, setPrimaryColor] = useState(onboardingData.branding?.primaryColor || "#1f5582")
  const [secondaryColor, setSecondaryColor] = useState(onboardingData.branding?.secondaryColor || "#ff6b35")
  const [font, setFont] = useState(onboardingData.branding?.font || "Inter")
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processLogoFile(file)
    }
  }

  const processLogoFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB")
      return
    }
    
    setIsUploadingLogo(true)
    setLogoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoUrl(reader.result as string)
      setIsUploadingLogo(false)
    }
    reader.readAsDataURL(file)
  }

  const handleContinue = () => {
    updateOnboardingData({
      branding: {
        ...(logoUrl && { logoUrl }),
        ...(logoFile && { logoFile }),
        primaryColor,
        ...(secondaryColor && { secondaryColor }),
        font,
      },
    })
    navigateToNextStep()
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
      <FontLoader fonts={[font, 'Inter']} />
      <h2 className="text-2xl font-semibold text-primary-blue mb-6">Branding Customization</h2>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Side: Customization Controls */}
        <div className="space-y-8">
          <Card>
            <CardContent className="p-6">
              <Label htmlFor="logoUpload" className="block text-sm font-medium text-slate-700 mb-2">
                Logo Upload
              </Label>
              <div
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-all ${
                  isDragging 
                    ? "border-accent-orange bg-orange-50" 
                    : "border-slate-300 hover:border-accent-orange"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processLogoFile(e.dataTransfer.files[0])
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                }}
              >
                <div className="space-y-1 text-center">
                  {isUploadingLogo ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
                      <p className="text-sm text-slate-600 mt-2">Processing logo...</p>
                    </div>
                  ) : logoUrl ? (
                    <div className="relative group">
                      <Image
                        src={logoUrl || "/placeholder.svg"}
                        alt="Uploaded logo"
                        width={150}
                        height={75}
                        className="mx-auto object-contain max-h-[75px]"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-sm">Click to replace</p>
                      </div>
                    </div>
                  ) : (
                    <UploadCloud className={`mx-auto h-12 w-12 ${isDragging ? 'text-accent-orange' : 'text-slate-400'}`} />
                  )}
                  <div className="flex text-sm text-slate-600">
                    <span className="relative rounded-md font-medium text-primary-blue hover:text-accent-orange focus-within:outline-none">
                      <span>Upload a file</span>
                      <Input
                        id="logoUpload"
                        name="logoUpload"
                        type="file"
                        className="sr-only"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/png, image/jpeg, image/svg+xml"
                      />
                    </span>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    PNG, JPG, SVG up to 2MB. Recommended: 200x100px, transparent PNG.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Label className="block text-sm font-medium text-slate-700 mb-2">Preset Themes</Label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {presetThemes.map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => {
                      setPrimaryColor(theme.primary)
                      setSecondaryColor(theme.secondary)
                    }}
                    className="text-left p-3 border rounded-lg hover:shadow-md transition-shadow"
                    style={{ 
                      borderColor: primaryColor === theme.primary ? theme.primary : '#e2e8f0'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <div 
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: theme.secondary }}
                      />
                    </div>
                    <p className="text-sm font-medium">{theme.name}</p>
                    <p className="text-xs text-slate-500">{theme.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Label className="block text-sm font-medium text-slate-700 mb-2">Custom Colors</Label>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="primaryColor" className="text-xs text-slate-600">
                    Primary Color
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 p-0 border-0"
                    />
                    <Input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-9 flex-grow"
                    />
                  </div>
                  <div className="flex gap-1 mt-2">
                    {colorSwatches.map((color) => (
                      <button
                        key={color}
                        title={color}
                        onClick={() => setPrimaryColor(color)}
                        className="w-6 h-6 rounded border border-slate-300"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor" className="text-xs text-slate-600">
                    Secondary Color (Optional)
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-10 h-10 p-0 border-0"
                    />
                    <Input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-9 flex-grow"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Label htmlFor="fontSelection" className="block text-sm font-medium text-slate-700 mb-1">
                Font Selection
              </Label>
              <Select value={font} onValueChange={setFont}>
                <SelectTrigger id="fontSelection">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} style={{ fontFamily: option.value }}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Live Preview */}
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-medium text-primary-blue mb-4">Live Preview</h3>
          
          <Tabs defaultValue="desktop" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="desktop" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Desktop
              </TabsTrigger>
              <TabsTrigger value="mobile" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Mobile
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="desktop" className="mt-0">
              <div className="overflow-auto max-h-[600px] rounded-lg border border-slate-200">
                <BrandingPreview
                  logoUrl={logoUrl}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  font={font}
                  scale={0.75}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="mobile" className="mt-0">
              <div className="flex justify-center">
                <MobilePreview
                  logoUrl={logoUrl}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  font={font}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="flex justify-between mt-10">
        <Button variant="ghost" onClick={navigateToPrevStep} className="text-primary-blue hover:bg-blue-50">
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          onClick={handleContinue}
          className="bg-accent-orange hover:bg-orange-600 text-white"
          style={{ backgroundColor: "#ff6b35" }}
        >
          Continue <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
