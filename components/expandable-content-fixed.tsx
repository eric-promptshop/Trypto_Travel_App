"use client"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface ExpandableContentFixedProps {
  summary: string
  fullText: string
  additionalInfo?: string
  isExpanded: boolean
  onToggle: () => void
}

export function ExpandableContentFixed({
  summary,
  fullText,
  additionalInfo,
  isExpanded,
  onToggle,
}: ExpandableContentFixedProps) {
  // Simple component with direct rendering based on expanded state
  return (
    <div className="relative">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={isExpanded ? "expanded" : "collapsed"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isExpanded ? (
            <div>
              <p className="text-gray-600">{fullText}</p>
              {additionalInfo && <p className="text-gray-600 mt-2">{additionalInfo}</p>}
            </div>
          ) : (
            <p className="text-gray-600">{summary}</p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Read more/less button - simplified and more reliable */}
      {(fullText.length > summary.length || additionalInfo) && (
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            className="text-[#1f5582] hover:text-[#164569] border border-[#1f5582]/30 hover:bg-[#1f5582]/5"
            onClick={onToggle}
          >
            {isExpanded ? (
              <>
                Read less <ChevronUp className="ml-1 h-3 w-3" />
              </>
            ) : (
              <>
                Read more <ChevronDown className="ml-1 h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
