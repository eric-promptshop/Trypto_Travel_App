import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useOrientation } from "@/hooks/use-orientation"
import { useEffect, useState } from "react"
import { RotateCcw, Layout, Smartphone } from "lucide-react"

export function OrientationBanner() {
  const { orientation } = useOrientation()
  const [isMobile, setIsMobile] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (isMobile) {
      // Show banner briefly when orientation changes to inform about layout adaptation
      setShowBanner(true)
      const timer = setTimeout(() => setShowBanner(false), 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [orientation, isMobile])

  if (!isMobile || !showBanner) return null

  const isLandscape = orientation === "landscape"

  return (
    <div className="fixed top-0 left-0 w-full z-50 flex justify-center pointer-events-none">
      <div className="max-w-md w-full mx-auto px-2 pt-2">
        <Alert className={`${
          isLandscape 
            ? 'bg-blue-50 border-blue-200 text-blue-900' 
            : 'bg-green-50 border-green-200 text-green-900'
        } shadow-lg pointer-events-auto transition-all duration-300`}>
          <div className="flex items-center gap-2">
            {isLandscape ? (
              <Layout className="w-4 h-4" />
            ) : (
              <Smartphone className="w-4 h-4" />
            )}
            <AlertTitle className="text-sm font-medium">
              {isLandscape ? 'Landscape Layout Active' : 'Portrait Layout Active'}
            </AlertTitle>
          </div>
          <AlertDescription className="text-xs mt-1">
            {isLandscape 
              ? 'Layout optimized for landscape viewing with focused content display.'
              : 'Layout optimized for portrait mode with vertical content stacking.'
            }
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
} 