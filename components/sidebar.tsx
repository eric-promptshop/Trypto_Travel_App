"use client"

import { motion } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"
import { useOrientation } from "@/hooks/use-orientation"
import { useOneHandedMode } from "@/hooks/use-one-handed-mode"
import { useBatteryStatus } from "@/hooks/use-battery-status"

export function Sidebar() {
  const { orientation } = useOrientation();
  const oneHanded = useOneHandedMode();
  const { powerSaving } = useBatteryStatus();
  const duration = powerSaving ? 0.05 : 0.4;
  const delay1 = powerSaving ? 0 : 0.2;
  const delay2 = powerSaving ? 0 : 0.3;
  const isMobileLandscape = typeof window !== 'undefined' && window.innerWidth < 768 && orientation === 'landscape';
  if (oneHanded || isMobileLandscape) return null;

  return (
    <motion.div
      className="w-[30%] min-w-[300px] border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 overflow-y-auto"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration }}
    >
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay1, duration }}
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Trip Planning Assistant</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Use this space to add notes, preferences, or special requests for your Peru adventure.
        </p>
      </motion.div>

      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay2, duration }}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes & Preferences
          </label>
          <Textarea
            placeholder="Add your travel notes, special requests, dietary restrictions, or any other preferences..."
            className="min-h-[120px] resize-none border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#1f5582] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#1f5582] dark:focus:ring-[#3b82f6]"
          />
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Tips</h3>
          <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-[#1f5582] dark:bg-[#3b82f6] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
              Best time to visit Peru is during dry season (May-September)
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-[#1f5582] dark:bg-[#3b82f6] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
              Book Machu Picchu tickets in advance
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-[#1f5582] dark:bg-[#3b82f6] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
              Consider altitude sickness prevention in Cusco
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-[#1f5582] dark:bg-[#3b82f6] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
              Pack layers for varying climates
            </li>
          </ul>
        </div>
      </motion.div>
    </motion.div>
  )
}
