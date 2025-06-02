import { useEffect, useState } from "react"

// TypeScript type for BatteryManager (not always in lib.dom.d.ts)
interface BatteryManager extends EventTarget {
  charging: boolean
  chargingTime: number
  dischargingTime: number
  level: number // 0-1
  onchargingchange: ((this: BatteryManager, ev: Event) => any) | null
  onchargingtimechange: ((this: BatteryManager, ev: Event) => any) | null
  ondischargingtimechange: ((this: BatteryManager, ev: Event) => any) | null
  onlevelchange: ((this: BatteryManager, ev: Event) => any) | null
  // Some browsers may support this
  savingMode?: boolean
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>
}

export interface BatteryStatus {
  level: number | null // 0-1
  charging: boolean | null
  powerSaving: boolean // true if low battery or power saving mode
}

export function useBatteryStatus(): BatteryStatus {
  const [status, setStatus] = useState<BatteryStatus>({
    level: null,
    charging: null,
    powerSaving: false,
  })

  useEffect(() => {
    let battery: BatteryManager | null = null
    let mounted = true

    function update(b: BatteryManager) {
      if (!mounted) return
      setStatus({
        level: b.level,
        charging: b.charging,
        powerSaving:
          (typeof (b as any).savingMode === "boolean" && (b as any).savingMode) ||
          (b.level < 0.2 && !b.charging),
      })
    }

    const nav = navigator as NavigatorWithBattery
    if (nav.getBattery) {
      nav.getBattery().then((b: BatteryManager) => {
        battery = b
        update(b)
        b.addEventListener("levelchange", () => update(b))
        b.addEventListener("chargingchange", () => update(b))
        // Some browsers may support 'savingmodechange'
        b.addEventListener && b.addEventListener("savingmodechange", () => update(b))
      })
    }
    // If not supported, do nothing (status stays at default)
    return () => {
      mounted = false
      if (battery) {
        battery.removeEventListener("levelchange", () => update(battery!))
        battery.removeEventListener("chargingchange", () => update(battery!))
        battery.removeEventListener && battery.removeEventListener("savingmodechange", () => update(battery!))
      }
    }
  }, [])

  return status
} 