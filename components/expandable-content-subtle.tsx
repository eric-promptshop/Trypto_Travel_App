"use client"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

interface ExpandableContentSubtleProps {
  summary: string
  fullText: string
  additionalInfo?: string
  isExpanded: boolean
  onToggle: () => void
}

export function ExpandableContentSubtle({
  summary,
  fullText,
  additionalInfo,
  isExpanded,
  onToggle,
}: ExpandableContentSubtleProps) {
  return (
    <div className="relative">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={isExpanded ? "expanded" : "collapsed"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {isExpanded ? (
            <div>
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
            </div>
          ) : (
            <p className="text-gray-600">{summary}</p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Subtle text-based toggle */}
      {(fullText.length > summary.length || additionalInfo) && (
        <motion.div className="mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <motion.span
            className="inline-flex items-center text-sm text-[#1f5582] hover:text-[#164569] cursor-pointer transition-colors duration-200 hover:underline"
            onClick={onToggle}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isExpanded ? "less" : "more"}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.2 }}
                className="flex items-center"
              >
                {isExpanded ? "Read less" : "Read more"}
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="ml-1">
                  <ChevronDown className="h-3 w-3" />
                </motion.div>
              </motion.span>
            </AnimatePresence>
          </motion.span>
        </motion.div>
      )}
    </div>
  )
}
