"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Mail, MapPin } from "lucide-react"
import { useOnboarding } from "@/contexts/onboarding-context"

const benefits = [
  {
    icon: Sparkles,
    title: "Turn leads into gold",
    description: "AI-powered itinerary generation increases lead quality by 50%",
  },
  {
    icon: Mail,
    title: "Reduce email ping-pong",
    description: "Cut back-and-forth communications by 60%",
  },
  {
    icon: MapPin,
    title: "Instant visualization",
    description: "Let customers see their dream trip immediately",
  },
]

export function WelcomeScreen() {
  const { navigateToNextStep } = useOnboarding()

  return (
    <div className="text-center py-8 md:py-16">
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-blue mb-4">
        Transform Your Request Forms into Interactive Trip Builders
      </h1>
      <p className="text-lg md:text-xl text-slate-600 mb-10 md:mb-12">
        Set up your AI-powered trip builder in just 30 minutes
      </p>
      <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
        {benefits.map((benefit, index) => (
          <Card key={index} className="bg-white shadow-md text-left">
            <CardHeader>
              <div className="flex items-center gap-3">
                <benefit.icon className="w-8 h-8 text-accent-orange" />
                <CardTitle className="text-xl text-primary-blue">{benefit.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">{benefit.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button
        size="lg"
        onClick={navigateToNextStep}
        className="bg-accent-orange hover:bg-orange-600 text-white px-10 py-6 text-lg font-semibold rounded-md"
        style={{ backgroundColor: "#ff6b35" }}
      >
        Start Setup
      </Button>
      <p className="mt-4 text-sm text-slate-500">✓ No credit card required ✓ 30-day free trial</p>
    </div>
  )
}
