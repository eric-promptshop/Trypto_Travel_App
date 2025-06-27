"use client"

import * as React from "react"
import { X, Sparkles, Save, Shield, Star, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

interface PremiumFeaturesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PremiumFeaturesModal({ open, onOpenChange }: PremiumFeaturesModalProps) {
  const [email, setEmail] = React.useState("")
  const [sendDeals, setSendDeals] = React.useState(false)

  const features = [
    {
      icon: Sparkles,
      title: "Exclusive Deals",
      description: "Get access to member-only travel deals"
    },
    {
      icon: Save,
      title: "Save Your Progress",
      description: "Never lose your itinerary planning"
    },
    {
      icon: Shield,
      title: "Free Forever",
      description: "No credit card required"
    }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log({ email, sendDeals })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <Card className="border-0">
          <div className="relative">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-6 w-6" />
                  Unlock Premium Travel Features
                </DialogTitle>
                <DialogDescription className="text-blue-100 mt-2">
                  Get instant access to AI-powered trip planning and exclusive travel deals
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-4 bg-gray-50">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="deals"
                  checked={sendDeals}
                  onCheckedChange={(checked) => setSendDeals(checked as boolean)}
                />
                <Label
                  htmlFor="deals"
                  className="text-sm font-normal text-gray-600 cursor-pointer"
                >
                  Send me exclusive travel deals and destination guides
                </Label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Get Started Free
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="text-gray-500"
                >
                  Skip for now
                </Button>
              </div>

              <p className="text-xs text-center text-gray-500">
                We respect your privacy. Unsubscribe anytime.
              </p>
            </form>

            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-900">50k+ travelers</span>
                  <div className="flex items-center text-yellow-500">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                    <span className="ml-1 text-gray-600">4.9/5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  )
}