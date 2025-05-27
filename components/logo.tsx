"use client"

import { motion } from "framer-motion"
import { Plane } from "lucide-react"

export function Logo() {
  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <motion.div className="flex items-center" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-[#1f5582] via-[#3a7ca5] to-[#1f5582] text-transparent bg-clip-text logo-text">
            trypto
          </span>
          <motion.div
            initial={{ y: 0, x: 0 }}
            animate={{ y: -2, x: 2 }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              duration: 1.5,
            }}
          >
            <Plane className="h-4 w-4 ml-1 text-[#ff7b00] rotate-45" />
          </motion.div>
        </motion.div>
        <motion.div
          className="absolute -bottom-1 left-0 h-[2px] bg-gradient-to-r from-[#1f5582] to-transparent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />
      </div>
    </motion.div>
  )
}
