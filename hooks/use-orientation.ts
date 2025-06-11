import { useEffect, useState } from "react"

export type Orientation = "portrait" | "landscape"

function isOrientation(value: string): value is Orientation {
  return value === "portrait" || value === "landscape"
}

export function useOrientation(): { orientation: Orientation; angle: number } {
  const getOrientation = () => {
    if (typeof window === "undefined") {
      return { orientation: "portrait", angle: 0 } as { orientation: Orientation; angle: number }
    }
    // Prefer the Screen Orientation API
    if (window.screen && window.screen.orientation) {
      const { type, angle } = window.screen.orientation
      if (type.startsWith("portrait")) return { orientation: "portrait", angle } as { orientation: Orientation; angle: number }
      if (type.startsWith("landscape")) return { orientation: "landscape", angle } as { orientation: Orientation; angle: number }
      // fallback: map to Orientation type
      const fallback = type.includes("landscape") ? "landscape" : "portrait"
      return { orientation: fallback, angle } as { orientation: Orientation; angle: number }
    }
    // Fallback: use window.orientation (deprecated, but still present on some devices)
    if (typeof window.orientation === "number") {
      const angle = window.orientation as number
      if (angle === 0 || angle === 180) return { orientation: "portrait", angle } as { orientation: Orientation; angle: number }
      if (angle === 90 || angle === -90) return { orientation: "landscape", angle } as { orientation: Orientation; angle: number }
    }
    // Fallback: compare width and height
    const { innerWidth, innerHeight } = window
    return {
      orientation: innerWidth > innerHeight ? "landscape" : "portrait",
      angle: 0,
    } as { orientation: Orientation; angle: number }
  }

  const [state, setState] = useState(getOrientation())

  useEffect(() => {
    const handleChange = () => setState(getOrientation())
    if (window.screen && window.screen.orientation && window.screen.orientation.addEventListener) {
      window.screen.orientation.addEventListener("change", handleChange)
    } else {
      window.addEventListener("orientationchange", handleChange)
      window.addEventListener("resize", handleChange)
    }
    return () => {
      if (window.screen && window.screen.orientation && window.screen.orientation.removeEventListener) {
        window.screen.orientation.removeEventListener("change", handleChange)
      } else {
        window.removeEventListener("orientationchange", handleChange)
        window.removeEventListener("resize", handleChange)
      }
    }
  }, [])

  return state
} 