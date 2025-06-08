"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface ExpandableContentAdvancedProps {
  summary: string
  fullText: string
  additionalInfo?: string
  isExpanded: boolean
  onToggle: () => void
}

export function ExpandableContentAdvanced({
  summary,
  fullText,
  additionalInfo,
  isExpanded,
  onToggle,
}: ExpandableContentAdvancedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState<number | "auto">("auto")

  // Update height whenever content or expanded state changes
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerHeight(entry.contentRect.height)
        }
      })

      resizeObserver.observe(containerRef.current)
      return () => {
        if (containerRef.current) {
          resizeObserver.unobserve(containerRef.current)
        }
      }
    }
  }, [isExpanded])

  return (
    <div className="relative">
      <motion.div
        animate={{ height: containerHeight }}
        initial={false}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="overflow-hidden"
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={isExpanded ? "expanded" : "collapsed"}
            initial={{ opacity: 0, y: isExpanded ? 20 : -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isExpanded ? -20 : 20 }}
            transition={{ duration: 0.2 }}
            ref={containerRef}
          >
            {isExpanded ? (
              <>
                <p className="text-gray-600">{fullText}</p>
                {additionalInfo && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="text-gray-600 mt-2"
                  >
                    {additionalInfo}
                  </motion.p>
                )}
              </>
            ) : (
              <p className="text-gray-600">{summary}</p>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {(fullText.length > summary.length || additionalInfo) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#1f5582] hover:text-[#164569] hover:bg-[#1f5582]/5 p-0 h-auto read-more-btn"
            onClick={onToggle}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isExpanded ? "less" : "more"}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="flex items-center"
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
              </motion.span>
            </AnimatePresence>
          </Button>
        </motion.div>
      )}
    </div>
  )
}
