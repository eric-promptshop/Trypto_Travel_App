"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface ExpandableContentProps {
  summary: string
  fullText: string
  additionalInfo?: string
  isExpanded: boolean
  onToggle: () => void
}

export function ExpandableContent({ summary, fullText, additionalInfo, isExpanded, onToggle }: ExpandableContentProps) {
  const [height, setHeight] = useState<number | "auto">("auto")
  const fullContentRef = useRef<HTMLDivElement>(null)
  const summaryContentRef = useRef<HTMLDivElement>(null)

  // Measure both heights on mount and when content changes
  useEffect(() => {
    const measureHeights = () => {
      if (fullContentRef.current && summaryContentRef.current) {
        const fullHeight = fullContentRef.current.offsetHeight
        const summaryHeight = summaryContentRef.current.offsetHeight

        // Set the height based on current state
        setHeight(isExpanded ? fullHeight : summaryHeight)
      }
    }

    measureHeights()

    // Re-measure on window resize
    window.addEventListener("resize", measureHeights)
    return () => window.removeEventListener("resize", measureHeights)
  }, [isExpanded, fullText, summary, additionalInfo])

  // Update height when expanded state changes
  useEffect(() => {
    if (fullContentRef.current && summaryContentRef.current) {
      const targetHeight = isExpanded ? fullContentRef.current.offsetHeight : summaryContentRef.current.offsetHeight

      setHeight(targetHeight)
    }
  }, [isExpanded])

  return (
    <div className="relative">
      {/* Container with animated height */}
      <motion.div
        animate={{ height }}
        initial={false}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="overflow-hidden"
      >
        {/* Both content versions are always in the DOM, but only one is visible */}
        <div
          ref={fullContentRef}
          className="absolute top-0 left-0 right-0"
          style={{ visibility: isExpanded ? "visible" : "hidden" }}
        >
          <p className="text-gray-600">{fullText}</p>

          {additionalInfo && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: isExpanded ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="text-gray-600 mt-2"
            >
              {additionalInfo}
            </motion.p>
          )}
        </div>

        <div
          ref={summaryContentRef}
          className="absolute top-0 left-0 right-0"
          style={{ visibility: isExpanded ? "hidden" : "visible" }}
        >
          <p className="text-gray-600">{summary}</p>
        </div>

        {/* Invisible spacer to maintain proper height */}
        <div
          style={{
            height: isExpanded ? fullContentRef.current?.offsetHeight : summaryContentRef.current?.offsetHeight,
          }}
        />
      </motion.div>

      {/* Read more/less button */}
      {(fullText.length > summary.length || additionalInfo) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#1f5582] hover:text-[#164569] hover:bg-[#1f5582]/5 p-0 h-auto read-more-btn"
            onClick={onToggle}
          >
            {isExpanded ? (
              <>
                Read less <ChevronUp className="ml-1 h-3 w-3 inline" />
              </>
            ) : (
              <>
                Read more <ChevronDown className="ml-1 h-3 w-3 inline" />
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  )
}
