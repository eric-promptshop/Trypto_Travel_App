"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { useOnboarding } from "@/contexts/onboarding-context"
import { useOnboardingIntegration } from "@/components/onboarding/OnboardingIntegrationWrapper"
import { ChevronLeft, CheckCircle, Rocket, Download, Eye, ExternalLink, Loader2 } from "lucide-react"

// Simple Confetti Component (CSS based)
const ConfettiPiece = ({ id, style }: { id: number; style: React.CSSProperties }) => (
  <div
    key={id}
    className="absolute w-2 h-4 opacity-70 animate-confetti-fall"
    style={{
      ...style,
      animationDelay: `${Math.random() * 2}s`,
      animationDuration: `${3 + Math.random() * 2}s`,
    }}
  />
)

const ConfettiExplosion = () => {
  const colors = ["#1f5582", "#ff6b35", "#22c55e", "#facc15", "#ec4899"]
  const pieces = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    style: {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * -50 - 50}%`, // Start above screen
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      transform: `rotate(${Math.random() * 360}deg)`,
    },
  }))
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((p) => (
        <ConfettiPiece key={p.id} id={p.id} style={p.style} />
      ))}
    </div>
  )
}

export function ReviewLaunchScreen() {
  const { onboardingData, updateOnboardingData, navigateToPrevStep, navigateToStep } = useOnboarding()
  const { completeOnboarding, deployTenant, tenantData, isLoading } = useOnboardingIntegration()
  const [isReadyToLaunch, setIsReadyToLaunch] = useState(onboardingData.isReadyToLaunch || false)
  const [showLaunchModal, setShowLaunchModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [deploymentInfo, setDeploymentInfo] = useState<any>(null)

  const summaryItems = [
    {
      title: "Company Profile",
      details: `${onboardingData.companyProfile?.companyName || "N/A"} - ${onboardingData.companyProfile?.primaryDestinations?.join(", ") || "N/A"} Specialist`,
      isSet: !!onboardingData.companyProfile?.companyName,
    },
    {
      title: "Content",
      details: `${onboardingData.contentImport?.importedToursCount || 0} tours imported and configured`,
      isSet: (onboardingData.contentImport?.importedToursCount || 0) > 0,
    },
    {
      title: "Pricing",
      details: `${onboardingData.pricingConfig?.matrix?.length || 0} destinations priced and ready`,
      isSet: (onboardingData.pricingConfig?.matrix?.length || 0) > 0,
    },
    {
      title: "Branding",
      details: `Custom look applied (Primary: ${onboardingData.branding?.primaryColor || "Default"})`,
      isSet: !!onboardingData.branding?.primaryColor,
    },
    {
      title: "Integration",
      details: onboardingData.integrations?.crm
        ? `Connected to ${onboardingData.integrations.crm.toUpperCase()}`
        : "No CRM connected",
      isSet: !!onboardingData.integrations?.crm,
    },
  ]

  const handleLaunch = async () => {
    if (!isReadyToLaunch || !tenantData.tenantId) return

    try {
      // Mark onboarding as ready to launch
      updateOnboardingData({ isReadyToLaunch: true })
      
      // Complete onboarding in backend - activates the tenant
      const completedTenant = await completeOnboarding()
      
      // Deploy tenant to staging environment
      const deployment = await deployTenant('path-based')
      setDeploymentInfo(deployment)
      
      // Show success modal
      setShowLaunchModal(true)
    } catch (error) {
      console.error('Error launching:', error)
      // Still show modal for demo purposes
      setShowLaunchModal(true)
    }
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-primary-blue mb-6 text-center">Review & Launch</h2>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {summaryItems.map((item) => (
          <Card key={item.title} className={item.isSet ? "border-green-300 bg-green-50/50" : "border-slate-200"}>
            <CardHeader>
              <CardTitle className="text-lg text-primary-blue flex items-center">
                <CheckCircle className={`w-5 h-5 mr-2 ${item.isSet ? "text-success-default" : "text-slate-400"}`} />
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{item.details}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-10 p-6 bg-slate-50 border-slate-200">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowPreviewModal(true)}
            className="border-primary-blue text-primary-blue hover:bg-primary-blue/10"
          >
            <Eye className="w-4 h-4 mr-2" /> Preview Trip Builder
          </Button>
          <Button variant="ghost" className="text-primary-blue hover:bg-primary-blue/10">
            <Download className="w-4 h-4 mr-2" /> Download Setup Guide
          </Button>
        </div>
      </Card>

      <div className="text-center p-8 border-2 border-dashed border-accent-orange/50 rounded-lg bg-orange-50/30">
        <Rocket className="w-16 h-16 text-accent-orange mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-primary-blue mb-3">You're all set! Ready to go live?</h3>
        <div className="flex items-center justify-center space-x-2 my-6">
          <Checkbox
            id="readyToLaunch"
            checked={isReadyToLaunch}
            onCheckedChange={(checked) => setIsReadyToLaunch(Boolean(checked))}
          />
          <Label htmlFor="readyToLaunch" className="text-sm font-medium text-slate-700">
            I've reviewed everything and I'm ready to launch
          </Label>
        </div>
        <Button
          size="lg"
          onClick={handleLaunch}
          disabled={!isReadyToLaunch || !tenantData.tenantId || isLoading}
          className="bg-success-default hover:bg-green-600 text-white px-10 py-3 text-lg disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Launching...
            </>
          ) : (
            'Activate Trip Builder'
          )}
        </Button>
      </div>

      <div className="flex justify-between mt-12">
        <Button variant="ghost" onClick={navigateToPrevStep} className="text-primary-blue hover:bg-blue-50">
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[600px] lg:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Trip Builder Preview</DialogTitle>
          </DialogHeader>
          <div className="py-4 h-[60vh] bg-slate-100 flex items-center justify-center text-slate-500">
            <p>(Live preview of the trip builder would be embedded here)</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Launch Success Modal */}
      <Dialog open={showLaunchModal} onOpenChange={setShowLaunchModal}>
        <DialogContent className="sm:max-w-md text-center overflow-hidden">
          <ConfettiExplosion />
          <DialogHeader className="pt-8">
            <DialogTitle className="text-3xl font-bold text-success-default">🎉 Your Trip Builder is Live!</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-lg text-slate-700 mb-6">
              Congratulations! Your AI-powered trip builder is now active and ready to engage your customers.
            </p>
            <h4 className="font-semibold text-primary-blue mb-3">What's next?</h4>
            {/* Show deployment URLs if available */}
            {deploymentInfo && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h5 className="font-semibold text-green-800 mb-2">🌐 Your Instance URLs:</h5>
                <div className="space-y-1 text-sm">
                  <p className="text-green-700">
                    Path-based: <code className="bg-white px-2 py-1 rounded">/client/{deploymentInfo.slug || 'your-company'}</code>
                  </p>
                  {deploymentInfo.urls?.staging && (
                    <p className="text-green-700">
                      Staging: <a href={deploymentInfo.urls.staging} target="_blank" rel="noopener noreferrer" className="underline">{deploymentInfo.urls.staging}</a>
                    </p>
                  )}
                </div>
              </div>
            )}

            <ul className="space-y-2 text-left text-primary-blue">
              {[
                { 
                  text: "View your live trip builder", 
                  href: tenantData.tenantId ? `/client/${onboardingData.companyProfile?.companyName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'demo'}` : "#", 
                  icon: <ExternalLink className="w-4 h-4 mr-2" /> 
                },
                { text: "View admin dashboard", href: "/admin", icon: <ExternalLink className="w-4 h-4 mr-2" /> },
                { text: "Check deployment status", href: "/admin#deployments", icon: <ExternalLink className="w-4 h-4 mr-2" /> },
                { text: "Multi-tenant demo", href: "/demo-multitenant", icon: <ExternalLink className="w-4 h-4 mr-2" /> },
              ].map((link) => (
                <li key={link.text}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent-orange transition-colors flex items-center"
                  >
                    {link.icon} {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter className="sm:justify-center pb-8">
            <DialogClose asChild>
              <Button
                type="button"
                className="bg-primary-blue hover:bg-primary-blue/90 text-white"
                onClick={() => navigateToStep("welcome")} // Or a dashboard
              >
                Go to Dashboard (mock)
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
