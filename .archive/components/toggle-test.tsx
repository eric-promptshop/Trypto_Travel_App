"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function ToggleTest() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-bold mb-2">Toggle Test</h2>
      <p>Current state: {isExpanded ? "Expanded" : "Collapsed"}</p>
      <Button className="mt-2" onClick={() => setIsExpanded(!isExpanded)}>
        Toggle
      </Button>
    </div>
  )
}
