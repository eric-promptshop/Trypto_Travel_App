"use client"

import { motion } from "framer-motion"

export function LogoCreative() {
  return (
    <motion.div
      className="flex items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <motion.div className="flex items-center" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
          <span className="font-extrabold text-2xl tracking-tight relative">
            <span className="bg-gradient-to-r from-[#1f5582] to-[#3a7ca5] text-transparent bg-clip-text">try</span>
            <span className="relative">
              <span className="bg-gradient-to-r from-[#ff7b00] to-[#ff9a44] text-transparent bg-clip-text">p</span>
              <motion.span
                className="absolute -top-1 right-0 w-1.5 h-1.5 bg-[#ff7b00] rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.7, 1],
                }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 2,
                }}
              />
            </span>
            <span className="bg-gradient-to-r from-[#3a7ca5] to-[#1f5582] text-transparent bg-clip-text">to</span>
          </span>
        </motion.div>
        <motion.div
          className="absolute -bottom-1 left-0 h-[2px] bg-gradient-to-r from-[#1f5582] via-[#ff7b00] to-transparent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />
      </div>
    </motion.div>
  )
}
