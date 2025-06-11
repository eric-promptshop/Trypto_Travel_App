import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useBatteryStatus } from "@/hooks/use-battery-status"
import { BatteryCharging, BatteryLow } from "lucide-react"

export function BatteryStatusBanner() {
  const { level, charging, powerSaving } = useBatteryStatus()
  if (!powerSaving) return null

  let batteryIcon = <BatteryLow className="inline w-5 h-5 mr-2 text-yellow-600" />
  if (charging) batteryIcon = <BatteryCharging className="inline w-5 h-5 mr-2 text-green-600" />

  return (
    <div className="fixed top-12 left-0 w-full z-40 flex justify-center pointer-events-none">
      <div className="max-w-md w-full mx-auto px-2 pt-2">
        <Alert className="bg-yellow-50 border-yellow-300 text-yellow-900 shadow pointer-events-auto flex items-center">
          {batteryIcon}
          <div>
            <AlertTitle>Battery Saver</AlertTitle>
            <AlertDescription>
              Some features may be limited to conserve power.
              {typeof level === "number" && (
                <span className="ml-2 text-xs text-yellow-800">
                  Battery: {(level * 100).toFixed(0)}% {charging ? "(Charging)" : ""}
                </span>
              )}
            </AlertDescription>
          </div>
        </Alert>
      </div>
    </div>
  )
} 