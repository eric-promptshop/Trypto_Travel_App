"use client"

import { useState, useRef, type ChangeEvent } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useOnboarding } from "@/contexts/onboarding-context"
import { ChevronLeft, ChevronRight, UploadCloud } from "lucide-react"

const fontOptions = [
  { value: "Inter", label: "Modern (Inter)" },
  { value: "Georgia", label: "Classic (Georgia)" },
  { value: "Open Sans", label: "Friendly (Open Sans)" },
  { value: "Roboto", label: "Professional (Roboto)" },
]

const colorSwatches = ["#1f5582", "#ff6b35", "#065f46", "#7c3aed", "#db2777", "#ca8a04"]

export function BrandingCustomizationScreen() {
  const { onboardingData, updateOnboardingData, navigateToNextStep, navigateToPrevStep } = useOnboarding()

  const [logoUrl, setLogoUrl] = useState<string | undefined>(onboardingData.branding?.logoUrl)
  const [logoFile, setLogoFile] = useState<File | undefined>(onboardingData.branding?.logoFile)
  const [primaryColor, setPrimaryColor] = useState(onboardingData.branding?.primaryColor || "#1f5582")
  const [secondaryColor, setSecondaryColor] = useState(onboardingData.branding?.secondaryColor || "#ff6b35")
  const [font, setFont] = useState(onboardingData.branding?.font || "Inter")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleContinue = () => {
    updateOnboardingData({
      branding: {
        logoUrl,
        logoFile,
        primaryColor,
        secondaryColor,
        font,
      },
    })
    navigateToNextStep()
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
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
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md cursor-pointer hover:border-accent-orange"
                onClick={() => fileInputRef.current?.click()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setLogoFile(e.dataTransfer.files[0])
                    const reader = new FileReader()
                    reader.onloadend = () => setLogoUrl(reader.result as string)
                    reader.readAsDataURL(e.dataTransfer.files[0])
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="space-y-1 text-center">
                  {logoUrl ? (
                    <Image
                      src={logoUrl || "/placeholder.svg"}
                      alt="Uploaded logo"
                      width={150}
                      height={75}
                      className="mx-auto object-contain max-h-[75px]"
                    />
                  ) : (
                    <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
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
              <Label className="block text-sm font-medium text-slate-700 mb-2">Colors</Label>
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
        <div className="bg-slate-100 p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-medium text-primary-blue mb-4 text-center">Live Preview</h3>
          <div
            className="aspect-[9/16] max-h-[600px] mx-auto w-full max-w-[300px] bg-white rounded-xl shadow-xl overflow-hidden border-4 border-slate-800"
            style={{ fontFamily: font }}
          >
            {/* Mock Header */}
            <div className="p-3 flex items-center justify-between" style={{ backgroundColor: primaryColor }}>
              {logoUrl ? (
                <Image
                  src={logoUrl || "/placeholder.svg"}
                  alt="Preview logo"
                  width={80}
                  height={40}
                  className="object-contain max-h-[30px]"
                />
              ) : (
                <div className="w-16 h-6 bg-slate-300 rounded opacity-50"></div>
              )}
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: secondaryColor || primaryColor }}></div>
            </div>
            {/* Mock Content */}
            <div className="p-4">
              <h4 className="text-lg font-semibold mb-2" style={{ color: primaryColor }}>
                Your Amazing Trip
              </h4>
              <p className="text-xs text-slate-700 mb-3">
                Explore the wonders of the world with our custom-tailored itineraries. This is a preview of how your
                trip builder might look.
              </p>
              <Button
                size="sm"
                style={{ backgroundColor: secondaryColor || primaryColor, color: "white" }}
                className="w-full"
              >
                Get Started
              </Button>
              <div className="mt-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-slate-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
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
