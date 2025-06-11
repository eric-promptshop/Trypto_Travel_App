"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useOnboarding, type OnboardingData } from "@/contexts/onboarding-context"
import { useOnboardingIntegration } from "@/components/onboarding/OnboardingIntegrationWrapper"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

const allDestinations = [
  "Peru",
  "Brazil",
  "Argentina",
  "Chile",
  "Colombia",
  "Ecuador",
  "Bolivia",
  "Uruguay",
  "Paraguay",
]

export function CompanyProfileScreen() {
  const { onboardingData, updateOnboardingData, navigateToNextStep, navigateToPrevStep } = useOnboarding()
  const { createTenantFromOnboarding, tenantData, isLoading } = useOnboardingIntegration()

  const [profile, setProfile] = useState<NonNullable<OnboardingData["companyProfile"]>>(
    onboardingData.companyProfile || {
      companyName: "",
      websiteUrl: "",
      contactEmail: "",
      phoneNumber: "",
      primaryDestinations: [],
      companyType: "custom",
      averageTripValue: "$5,000 - $10,000 per person",
      monthlyLeads: "10-25",
    },
  )

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: keyof NonNullable<OnboardingData["companyProfile"]>, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleDestinationChange = (destination: string) => {
    setProfile((prev) => {
      const newDestinations = prev!.primaryDestinations.includes(destination)
        ? prev!.primaryDestinations.filter((d) => d !== destination)
        : [...prev!.primaryDestinations, destination]
      return { ...prev!, primaryDestinations: newDestinations }
    })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!profile.companyName) newErrors.companyName = "Company Name is required."
    if (!profile.websiteUrl) newErrors.websiteUrl = "Website URL is required."
    else if (!/^https?:\/\/.+/.test(profile.websiteUrl))
      newErrors.websiteUrl = "Please enter a valid URL (e.g., https://example.com)."
    if (!profile.contactEmail) newErrors.contactEmail = "Contact Email is required."
    else if (!/\S+@\S+\.\S+/.test(profile.contactEmail)) newErrors.contactEmail = "Please enter a valid email address."
    if (profile.primaryDestinations.length === 0)
      newErrors.primaryDestinations = "Please select at least one primary destination."

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = async () => {
    if (!validate()) return

    try {
      // Update onboarding data first
      updateOnboardingData({ companyProfile: profile })
      
      // Create tenant in backend if it doesn't exist yet
      if (!tenantData.tenantId) {
        await createTenantFromOnboarding(profile)
      }
      
      // Navigate to next step
      navigateToNextStep()
    } catch (error) {
      console.error('Error creating tenant:', error)
      // Still allow user to continue - they can retry later
      navigateToNextStep()
    }
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-primary-blue mb-6">Company Profile</h2>

      <section className="mb-8">
        <h3 className="text-lg font-medium text-primary-blue mb-4 border-b pb-2">Company Information</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-1">
              Company Name*
            </Label>
            <Input
              id="companyName"
              value={profile.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              placeholder="Adventure Tours Inc."
              className={errors.companyName ? "border-red-500" : ""}
            />
            {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
          </div>
          <div>
            <Label htmlFor="websiteUrl" className="block text-sm font-medium text-slate-700 mb-1">
              Website URL*
            </Label>
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm h-10">
                https://
              </span>
              <Input
                id="websiteUrl"
                value={profile.websiteUrl.replace(/^https?:\/\//, "")}
                onChange={(e) => handleChange("websiteUrl", `https://${e.target.value.replace(/^https?:\/\//, "")}`)}
                placeholder="yourcompany.com"
                className={`rounded-l-none ${errors.websiteUrl ? "border-red-500" : ""}`}
              />
            </div>
            {errors.websiteUrl && <p className="text-red-500 text-xs mt-1">{errors.websiteUrl}</p>}
          </div>
          <div>
            <Label htmlFor="contactEmail" className="block text-sm font-medium text-slate-700 mb-1">
              Contact Email*
            </Label>
            <Input
              id="contactEmail"
              type="email"
              value={profile.contactEmail}
              onChange={(e) => handleChange("contactEmail", e.target.value)}
              placeholder="contact@yourcompany.com"
              className={errors.contactEmail ? "border-red-500" : ""}
            />
            {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>}
          </div>
          <div>
            <Label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={profile.phoneNumber}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-medium text-primary-blue mb-4 border-b pb-2">Trip Details</h3>
        <div className="mb-6">
          <Label className="block text-sm font-medium text-slate-700 mb-2">Primary Destinations*</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
            {allDestinations.map((dest) => (
              <div key={dest} className="flex items-center space-x-2">
                <Checkbox
                  id={`dest-${dest}`}
                  checked={profile.primaryDestinations.includes(dest)}
                  onCheckedChange={() => handleDestinationChange(dest)}
                />
                <Label htmlFor={`dest-${dest}`} className="text-sm font-normal text-slate-700">
                  {dest}
                </Label>
              </div>
            ))}
          </div>
          {errors.primaryDestinations && <p className="text-red-500 text-xs mt-1">{errors.primaryDestinations}</p>}
        </div>

        <div className="mb-6">
          <Label className="block text-sm font-medium text-slate-700 mb-2">Company Type*</Label>
          <RadioGroup
            value={profile.companyType}
            onValueChange={(value) => handleChange("companyType", value as "custom" | "group" | "both")}
            className="flex flex-col md:flex-row gap-4"
          >
            {(["custom", "group", "both"] as const).map((type) => (
              <Label
                key={type}
                htmlFor={`type-${type}`}
                className={`flex-1 p-4 border rounded-md cursor-pointer hover:border-accent-orange transition-colors ${profile.companyType === type ? "border-accent-orange bg-orange-50" : "border-slate-300"}`}
              >
                <div className="flex items-center">
                  <RadioGroupItem
                    value={type}
                    id={`type-${type}`}
                    className="mr-2 border-slate-400 text-accent-orange focus:ring-accent-orange"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    {type === "custom"
                      ? "Custom/Private Tours"
                      : type === "group"
                        ? "Group Departures Only"
                        : "Both Custom and Group"}
                  </span>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-2">Average Trip Value*</Label>
            <RadioGroup
              value={profile.averageTripValue}
              onValueChange={(value) => handleChange("averageTripValue", value)}
              className="space-y-2"
            >
              {[
                "Under $5,000 per person",
                "$5,000 - $10,000 per person",
                "$10,000 - $20,000 per person",
                "Over $20,000 per person",
              ].map((val) => (
                <div key={val} className="flex items-center">
                  <RadioGroupItem
                    value={val}
                    id={val.replace(/\s/g, "")}
                    className="border-slate-400 text-accent-orange focus:ring-accent-orange"
                  />
                  <Label htmlFor={val.replace(/\s/g, "")} className="ml-2 text-sm font-normal text-slate-700">
                    {val}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div>
            <Label htmlFor="monthlyLeads" className="block text-sm font-medium text-slate-700 mb-1">
              Estimated Monthly Leads*
            </Label>
            <Select value={profile.monthlyLeads} onValueChange={(value) => handleChange("monthlyLeads", value)}>
              <SelectTrigger id="monthlyLeads" className="w-full">
                <SelectValue placeholder="Select lead volume" />
              </SelectTrigger>
              <SelectContent>
                {["<10", "10-25", "25-50", "50-100", "100+"].map((val) => (
                  <SelectItem key={val} value={val}>
                    {val}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <div className="flex justify-between mt-10">
        <Button variant="ghost" onClick={navigateToPrevStep} className="text-primary-blue hover:bg-blue-50">
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={isLoading}
          className="bg-accent-orange hover:bg-orange-600 text-white disabled:opacity-50"
          style={{ backgroundColor: "#ff6b35" }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              Continue <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
