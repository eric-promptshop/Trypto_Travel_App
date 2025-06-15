"use client";

import { Mic } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface VoiceFlowButtonProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  visualizerBars?: number;
  className?: string;
  glowColor?: string;
  isListening?: boolean;
  transcript?: string;
}

export function VoiceFlowButton({
  onStart,
  onStop,
  visualizerBars = 32,
  className,
  glowColor = "#2563eb",
  isListening = false,
  transcript
}: VoiceFlowButtonProps) {
  const [time, setTime] = useState(0);
  const [flowParticles, setFlowParticles] = useState<Array<{ id: number; delay: number }>>([]);
  const [internalRecording, setInternalRecording] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setInternalRecording(isListening);
  }, [isListening]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (internalRecording) {
      intervalId = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    } else {
      if (time > 0) {
        onStop?.(time);
      }
      setTime(0);
    }

    return () => clearInterval(intervalId);
  }, [internalRecording, time, onStop]);

  useEffect(() => {
    if (internalRecording) {
      const particles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        delay: i * 0.2
      }));
      setFlowParticles(particles);
    } else {
      setFlowParticles([]);
    }
  }, [internalRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClick = () => {
    if (internalRecording) {
      onStop?.(time);
    } else {
      onStart?.();
    }
  };

  const hexToRgba = (hex: string, alpha: number = 1): string => {
    let hexValue = hex.replace("#", "");
    
    if (hexValue.length === 3) {
      hexValue = hexValue
        .split("")
        .map((char) => char + char)
        .join("");
    }
    
    const r = parseInt(hexValue.substring(0, 2), 16);
    const g = parseInt(hexValue.substring(2, 4), 16);
    const b = parseInt(hexValue.substring(4, 6), 16);
    
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return "rgba(37, 99, 235, 1)";
    }
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div className={cn("w-full py-8", className)}>
      <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-6">
        <div className="relative">
          <button
            ref={buttonRef}
            className={cn(
              "group w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 relative overflow-hidden",
              internalRecording
                ? "bg-blue-600 hover:bg-blue-700 shadow-lg"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
            type="button"
            onClick={handleClick}
            style={{
              boxShadow: internalRecording 
                ? `0 0 20px ${hexToRgba(glowColor, 0.5)}, 0 0 40px ${hexToRgba(glowColor, 0.3)}`
                : undefined
            }}
          >
            <AnimatePresence>
              {flowParticles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="absolute w-1 h-1 rounded-full"
                  style={{ backgroundColor: glowColor }}
                  initial={{ 
                    scale: 0,
                    x: 0,
                    y: 0,
                    opacity: 0
                  }}
                  animate={{
                    scale: [0, 1, 0.5, 1, 0],
                    x: [
                      0,
                      Math.cos((particle.id * Math.PI * 2) / 8) * 15,
                      Math.cos((particle.id * Math.PI * 2) / 8) * 25,
                      Math.cos((particle.id * Math.PI * 2) / 8) * 35,
                      Math.cos((particle.id * Math.PI * 2) / 8) * 50
                    ],
                    y: [
                      0,
                      Math.sin((particle.id * Math.PI * 2) / 8) * 15,
                      Math.sin((particle.id * Math.PI * 2) / 8) * 25,
                      Math.sin((particle.id * Math.PI * 2) / 8) * 35,
                      Math.sin((particle.id * Math.PI * 2) / 8) * 50
                    ],
                    opacity: [0, 1, 0.8, 0.6, 0]
                  }}
                  transition={{
                    duration: 2,
                    delay: particle.delay,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
              ))}
            </AnimatePresence>

            <motion.div
              animate={internalRecording ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={{ duration: 1, repeat: internalRecording ? Infinity : 0 }}
            >
              <Mic 
                className={cn(
                  "w-8 h-8 transition-colors duration-300",
                  internalRecording 
                    ? "text-white" 
                    : "text-gray-600 dark:text-gray-300"
                )} 
              />
            </motion.div>

            {internalRecording && (
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: glowColor }}
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            )}
          </button>
        </div>

        <motion.span
          className={cn(
            "font-mono text-lg font-medium transition-all duration-300",
            internalRecording
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400"
          )}
          animate={internalRecording ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 1, repeat: internalRecording ? Infinity : 0 }}
        >
          {formatTime(time)}
        </motion.span>

        <div className="h-16 w-80 flex items-center justify-center gap-1">
          {[...Array(visualizerBars)].map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "w-1 rounded-full transition-all duration-300",
                internalRecording
                  ? "bg-gradient-to-t from-blue-600 to-blue-400"
                  : "bg-gray-300 dark:bg-gray-600"
              )}
              initial={{ height: 4 }}
              animate={
                internalRecording
                  ? {
                      height: [4, 20 + Math.random() * 40, 4],
                      backgroundColor: [
                        hexToRgba(glowColor, 0.6),
                        hexToRgba(glowColor, 1),
                        hexToRgba(glowColor, 0.6)
                      ]
                    }
                  : { height: 4 }
              }
              transition={{
                duration: 0.5 + Math.random() * 0.5,
                delay: i * 0.02,
                repeat: internalRecording ? Infinity : 0,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {transcript && internalRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md text-center"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">What we heard:</p>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{transcript}</p>
          </motion.div>
        )}

        <motion.p 
          className={cn(
            "text-sm font-medium transition-colors duration-300",
            internalRecording
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400"
          )}
          animate={internalRecording ? { opacity: [1, 0.7, 1] } : { opacity: 1 }}
          transition={{ duration: 1.5, repeat: internalRecording ? Infinity : 0 }}
        >
          {internalRecording ? "Listening... Click to stop" : "Click to describe your trip"}
        </motion.p>
      </div>
    </div>
  );
}