"use client"

import { motion } from "framer-motion"

export function FlightsView() {
  return (
    <motion.div className="w-full p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <motion.h2
        className="text-2xl font-bold text-[#1f5582] mb-4"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        Flights
      </motion.h2>
      <motion.p
        className="text-gray-600"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        Your flight details will appear here.
      </motion.p>
    </motion.div>
  )
}
