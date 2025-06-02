"use client"

import { motion } from "framer-motion"
import { Plane } from "lucide-react"
import { useBatteryStatus } from "@/hooks/use-battery-status"

export function Logo() {
  const { powerSaving } = useBatteryStatus();
  const duration = powerSaving ? 0.05 : 0.5;
  const repeat = powerSaving ? 0 : Number.POSITIVE_INFINITY;
  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration }}
    >
      <div className="relative">
        <motion.div className="flex items-center" whileHover={{ scale: 1.05 }} transition={{ duration: powerSaving ? 0.05 : 0.2 }}>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-[#1f5582] via-[#3a7ca5] to-[#1f5582] text-transparent bg-clip-text logo-text">
            trypto
          </span>
          <motion.div
            initial={{ y: 0, x: 0 }}
            animate={{ y: -2, x: 2 }}
            transition={{
              repeat,
              repeatType: "reverse",
              duration: powerSaving ? 0.05 : 1.5,
            }}
          >
            <Plane className="h-4 w-4 ml-1 text-[#ff7b00] rotate-45" />
          </motion.div>
        </motion.div>
        <motion.div
          className="absolute -bottom-1 left-0 h-[2px] bg-gradient-to-r from-[#1f5582] to-transparent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.3, duration }}
        />
      </div>
    </motion.div>
  )
}
