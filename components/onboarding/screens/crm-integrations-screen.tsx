"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useOnboarding } from "@/contexts/onboarding-context"
import { ChevronLeft, ChevronRight, Mail, CheckCircle, Zap, Loader2 } from "lucide-react"
// Mock logos - in a real app, use SVGs or images
const HubSpotLogo = () => <Zap className="w-8 h-8 text-[#FF7A59]" />
const SalesforceLogo = () => <Zap className="w-8 h-8 text-[#00A1E0]" />
const ZohoLogo = () => <Zap className="w-8 h-8 text-[#E42527]" />
const EmailLogo = () => <Mail className="w-8 h-8 text-slate-600" />

type CrmOption = "hubspot" | "salesforce" | "zoho" | "email"
type ConnectionStatus = "idle" | "connecting" | "connected" | "error"

export function CrmIntegrationsScreen() {
  const { onboardingData, updateOnboardingData, navigateToNextStep, navigateToPrevStep } = useOnboarding()

  const [selectedCrm, setSelectedCrm] = useState<CrmOption | undefined>(onboardingData.integrations?.crm)
  const [hubspotApiKey, setHubspotApiKey] = useState(onboardingData.integrations?.hubspotApiKey || "")
  const [hubspotPipeline, setHubspotPipeline] = useState(onboardingData.integrations?.hubspotPipeline || "")
  const [hubspotLeadAssignee, setHubspotLeadAssignee] = useState(onboardingData.integrations?.hubspotLeadAssignee || "")
  const [hubspotStatus, setHubspotStatus] = useState<ConnectionStatus>("idle")

  const [emailRecipients, setEmailRecipients] = useState<string[]>(onboardingData.integrations?.emailRecipients || [])
  const [currentEmail, setCurrentEmail] = useState("")
  const [emailFormat, setEmailFormat] = useState(onboardingData.integrations?.emailFormat || "simple")
  const [emailTestStatus, setEmailTestStatus] = useState<ConnectionStatus>("idle")

  const handleCrmSelect = (crm: CrmOption) => {
    setSelectedCrm(crm)
    // Reset other CRM states if needed
    if (crm !== "hubspot") setHubspotStatus("idle")
    if (crm !== "email") setEmailTestStatus("idle")
  }

  const testHubSpotConnection = () => {
    setHubspotStatus("connecting")
    setTimeout(() => {
      if (hubspotApiKey === "valid-key") {
        // Mock success
        setHubspotStatus("connected")
      } else {
        setHubspotStatus("error")
      }
    }, 2000)
  }

  const addEmailRecipient = () => {
    if (currentEmail && !emailRecipients.includes(currentEmail) && /\S+@\S+\.\S+/.test(currentEmail)) {
      setEmailRecipients([...emailRecipients, currentEmail])
      setCurrentEmail("")
    }
  }
  const removeEmailRecipient = (emailToRemove: string) => {
    setEmailRecipients(emailRecipients.filter((email) => email !== emailToRemove))
  }

  const sendTestEmail = () => {
    setEmailTestStatus("connecting")
    setTimeout(() => {
      if (emailRecipients.length > 0) {
        setEmailTestStatus("connected")
        setTimeout(() => setEmailTestStatus("idle"), 3000) // Reset after a bit
      } else {
        setEmailTestStatus("error")
      }
    }, 1500)
  }

  const handleContinue = () => {
    updateOnboardingData({
      integrations: {
        crm: selectedCrm,
        hubspotApiKey: selectedCrm === "hubspot" ? hubspotApiKey : undefined,
        hubspotPipeline: selectedCrm === "hubspot" ? hubspotPipeline : undefined,
        hubspotLeadAssignee: selectedCrm === "hubspot" ? hubspotLeadAssignee : undefined,
        emailRecipients: selectedCrm === "email" ? emailRecipients : undefined,
        emailFormat: selectedCrm === "email" ? emailFormat : undefined,
      },
    })
    navigateToNextStep()
  }

  const crmOptions: { id: CrmOption; name: string; logo: JSX.Element }[] = [
    { id: "hubspot", name: "HubSpot", logo: <HubSpotLogo /> },
    { id: "salesforce", name: "Salesforce", logo: <SalesforceLogo /> },
    { id: "zoho", name: "Zoho CRM", logo: <ZohoLogo /> },
    { id: "email", name: "Email Only", logo: <EmailLogo /> },
  ]

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-primary-blue mb-2">CRM & Integrations</h2>
      <p className="text-slate-600 mb-6">How should we deliver your enhanced leads?</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {crmOptions.map((option) => (
          <Card
            key={option.id}
            onClick={() => handleCrmSelect(option.id)}
            className={`cursor-pointer hover:shadow-lg transition-shadow ${selectedCrm === option.id ? "border-accent-orange ring-2 ring-accent-orange" : "border-slate-200"}`}
          >
            <CardContent className="p-6 text-center">
              <div className="mb-3 flex justify-center">{option.logo}</div>
              <p className="font-medium text-slate-700">{option.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCrm === "hubspot" && (
        <Card className="mb-8 border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl text-primary-blue flex items-center gap-2">
              <HubSpotLogo /> Configure HubSpot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="hubspotApiKey">API Key</Label>
              <Input
                id="hubspotApiKey"
                type="password"
                value={hubspotApiKey}
                onChange={(e) => setHubspotApiKey(e.target.value)}
                placeholder="Enter your HubSpot API Key"
              />
            </div>
            <div>
              <Label htmlFor="hubspotPipeline">Pipeline</Label>
              <Select value={hubspotPipeline} onValueChange={setHubspotPipeline}>
                <SelectTrigger id="hubspotPipeline">
                  <SelectValue placeholder="Select pipeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Pipeline</SelectItem>
                  <SelectItem value="support">Support Pipeline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="hubspotLeadAssignee">Lead Assignment</Label>
              <Select value={hubspotLeadAssignee} onValueChange={setHubspotLeadAssignee}>
                <SelectTrigger id="hubspotLeadAssignee">
                  <SelectValue placeholder="Select lead assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_robin">Round Robin</SelectItem>
                  <SelectItem value="specific_user">Specific User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={testHubSpotConnection} disabled={hubspotStatus === "connecting" || !hubspotApiKey}>
              {hubspotStatus === "connecting" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Test Connection
            </Button>
            {hubspotStatus === "connected" && (
              <p className="text-sm text-success-default flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" /> Successfully connected to HubSpot!
              </p>
            )}
            {hubspotStatus === "error" && (
              <p className="text-sm text-red-500">Connection failed. Please check your API key.</p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedCrm === "email" && (
        <Card className="mb-8 border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl text-primary-blue flex items-center gap-2">
              <EmailLogo /> Configure Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="emailRecipients">Email Addresses (for lead notifications)</Label>
              <div className="flex gap-2">
                <Input
                  id="emailRecipients"
                  type="email"
                  value={currentEmail}
                  onChange={(e) => setCurrentEmail(e.target.value)}
                  placeholder="e.g., sales@example.com"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addEmailRecipient()
                    }
                  }}
                />
                <Button onClick={addEmailRecipient} variant="outline" className="shrink-0">
                  Add
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {emailRecipients.map((email) => (
                  <span
                    key={email}
                    className="flex items-center gap-1 text-sm bg-slate-100 text-slate-700 px-2 py-1 rounded-full"
                  >
                    {email}
                    <button onClick={() => removeEmailRecipient(email)} className="text-slate-500 hover:text-red-500">
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="emailFormat">Email Format</Label>
              <Select value={emailFormat} onValueChange={(val) => setEmailFormat(val as "simple" | "detailed")}>
                <SelectTrigger id="emailFormat">
                  <SelectValue placeholder="Select email format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple Summary</SelectItem>
                  <SelectItem value="detailed">Detailed Itinerary Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={sendTestEmail} disabled={emailTestStatus === "connecting" || emailRecipients.length === 0}>
              {emailTestStatus === "connecting" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Test Email
            </Button>
            {emailTestStatus === "connected" && (
              <p className="text-sm text-success-default flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" /> Test email sent successfully!
              </p>
            )}
            {emailTestStatus === "error" && (
              <p className="text-sm text-red-500">Failed to send test email. Please check addresses.</p>
            )}
          </CardContent>
        </Card>
      )}

      {(selectedCrm === "salesforce" || selectedCrm === "zoho") && (
        <Card className="mb-8 border-slate-200 bg-slate-50">
          <CardContent className="p-6 text-center">
            <p className="text-slate-600 font-medium">
              Integration with {selectedCrm === "salesforce" ? "Salesforce" : "Zoho CRM"} is coming soon!
            </p>
            <p className="text-sm text-slate-500">Select "Email Only" for now to receive leads.</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between mt-10">
        <Button variant="ghost" onClick={navigateToPrevStep} className="text-primary-blue hover:bg-blue-50">
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedCrm || (selectedCrm === "hubspot" && hubspotStatus !== "connected")}
          className="bg-accent-orange hover:bg-orange-600 text-white"
          style={{ backgroundColor: "#ff6b35" }}
        >
          Continue <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
      {!selectedCrm && (
        <p className="text-center text-sm text-amber-600 mt-4">Please select an integration option to continue.</p>
      )}
      {selectedCrm === "hubspot" && hubspotStatus !== "connected" && hubspotApiKey && (
        <p className="text-center text-sm text-amber-600 mt-4">
          Please test and ensure HubSpot connection is successful to continue.
        </p>
      )}
    </div>
  )
}
