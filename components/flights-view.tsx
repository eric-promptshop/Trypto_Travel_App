"use client"

import { motion } from "framer-motion"
import { useBatteryStatus } from "@/hooks/use-battery-status"

export function FlightsView() {
  const { powerSaving } = useBatteryStatus();
  const duration = powerSaving ? 0.05 : 0.4;
  const delay = powerSaving ? 0 : 0.2;
  return (
    <motion.div className="w-full p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration }}>
      <motion.h2
        className="text-2xl font-bold text-[#1f5582] mb-4"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ delay, duration }}
      >
        Flights
      </motion.h2>
      <motion.p
        className="text-gray-600"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: powerSaving ? 0 : 0.3, duration }}
      >
        Your flight details will appear here.
      </motion.p>
    </motion.div>
  )
}
