"use client"

import { motion } from "framer-motion"
import { Globe } from "lucide-react"
import { useBatteryStatus } from "@/hooks/use-battery-status"

export function LogoAlt() {
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
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              repeat,
              duration: powerSaving ? 0.05 : 20,
              ease: "linear",
            }}
            className="mr-1.5"
          >
            <Globe className="h-5 w-5 text-[#1f5582]" />
          </motion.div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-[#1f5582] via-[#3a7ca5] to-[#1f5582] text-transparent bg-clip-text logo-text">
            trypto
          </span>
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
