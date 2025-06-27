"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PremiumFeaturesModal } from "@/components/ui/premium-features-modal-simple"

export default function PremiumModalDemo() {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">Premium Features Modal Demo</h1>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          Click the button below to see the redesigned premium features modal using shadcn components
        </p>
        <Button 
          onClick={() => setOpen(true)}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          Open Premium Features Modal
        </Button>
      </div>

      <PremiumFeaturesModal open={open} onOpenChange={setOpen} />
    </div>
  )
}