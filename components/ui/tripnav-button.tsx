import * as React from "react"
import { Button, ButtonProps } from "./button"
import { cn } from "@/lib/utils"

export interface TripNavButtonProps extends ButtonProps {
  variant?: ButtonProps["variant"] | "accent" | "destination" | "booking" | "delay" | "weather" | "visa" | "currency" | "confirmed" | "pending" | "cancelled" | "business" | "leisure" | "adventure" | "budget" | "premium" | "luxury" | "beach" | "mountain" | "city"
}

const TripNavButton = React.forwardRef<HTMLButtonElement, TripNavButtonProps>(
  ({ className, variant, ...props }, ref) => {
    // Map custom variants to base button variants or apply custom styles
    const getVariantClass = () => {
      switch (variant) {
        // Travel-specific action variants
        case "accent":
          return "bg-[#FF7B00] text-white hover:bg-[#E56F00] shadow-md"
        case "destination":
          return "bg-[#4A90E2] text-white hover:bg-[#357ABD]"
        case "booking":
          return "bg-green-600 text-white hover:bg-green-700"
        
        // Status variants
        case "confirmed":
          return "bg-green-100 text-green-800 hover:bg-green-200"
        case "pending":
          return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
        case "cancelled":
          return "bg-red-100 text-red-800 hover:bg-red-200"
        
        // Travel type variants
        case "business":
          return "bg-slate-600 text-white hover:bg-slate-700"
        case "leisure":
          return "bg-purple-600 text-white hover:bg-purple-700"
        case "adventure":
          return "bg-orange-600 text-white hover:bg-orange-700"
        
        // Budget variants
        case "budget":
          return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
        case "premium":
          return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
        case "luxury":
          return "bg-purple-100 text-purple-800 hover:bg-purple-200"
        
        // Destination type variants
        case "beach":
          return "bg-cyan-100 text-cyan-800 hover:bg-cyan-200"
        case "mountain":
          return "bg-stone-100 text-stone-800 hover:bg-stone-200"
        case "city":
          return "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
        
        // Alert/notification variants
        case "delay":
          return "bg-amber-100 text-amber-800 hover:bg-amber-200"
        case "weather":
          return "bg-blue-100 text-blue-800 hover:bg-blue-200"
        case "visa":
          return "bg-violet-100 text-violet-800 hover:bg-violet-200"
        case "currency":
          return "bg-teal-100 text-teal-800 hover:bg-teal-200"
        
        default:
          // Use base button variant
          return ""
      }
    }

    const variantClass = getVariantClass()
    const baseVariant = variantClass ? undefined : variant as ButtonProps["variant"]

    return (
      <Button
        ref={ref}
        className={cn(variantClass, className)}
        variant={baseVariant}
        {...props}
      />
    )
  }
)

TripNavButton.displayName = "TripNavButton"

export { TripNavButton }