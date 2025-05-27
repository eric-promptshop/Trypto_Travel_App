"use client"

import { useEffect } from "react"

export function useKeyboardNavigation(onPrevious: () => void, onNext: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        onPrevious()
      } else if (event.key === "ArrowRight") {
        onNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onPrevious, onNext, enabled])
}
