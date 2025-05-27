"use client"

import { motion } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"

export function Sidebar() {
  return (
    <motion.div
      className="w-[30%] min-w-[300px] border-r border-gray-200 bg-white p-4 overflow-y-auto"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h1 className="text-xl font-bold text-[#1f5582]">Jenny & Tim's Date to South America</h1>
          <div className="text-gray-600">
            <p>Peru & Brazil | 13 Days | 4 Travelers</p>
            <p className="font-semibold">Price Estimate: $2,400/person</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tell us how to update your travel itinerary:
          </label>
          <Textarea
            placeholder="Type your travel preferences here..."
            className="w-full border-gray-300 focus:border-[#1f5582] focus:ring-[#1f5582] transition-all duration-300"
          />
        </motion.div>

        <motion.div
          className="border-t border-gray-200 pt-4 mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
            <motion.div
              className="bg-gray-100 p-3 rounded-lg mb-3 shadow-sm hover:shadow-md transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex justify-between items-start">
                <span className="font-semibold text-[#1f5582]">Jenny</span>
                <span className="text-xs text-gray-500">Sat 02 Jan '25 12:45pm</span>
              </div>
              <p className="text-gray-700 mt-1">
                I'd like to see a 13 day itinerary of Brazil and Peru, we'd like 3-Star Hotels and private tours
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
