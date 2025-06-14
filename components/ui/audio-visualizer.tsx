"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface AudioVisualizerProps {
  isActive: boolean
  className?: string
  barCount?: number
  minHeight?: number
  maxHeight?: number
  color?: string
}

export function AudioVisualizer({
  isActive,
  className,
  barCount = 5,
  minHeight = 4,
  maxHeight = 32,
  color = "rgb(59, 130, 246)" // blue-500
}: AudioVisualizerProps) {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [microphone, setMicrophone] = useState<MediaStream | null>(null)
  const [volumes, setVolumes] = useState<number[]>(Array(barCount).fill(0))
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    if (isActive) {
      // Initialize audio context and microphone
      const initAudio = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          const context = new AudioContext()
          const analyserNode = context.createAnalyser()
          const microphone = context.createMediaStreamSource(stream)
          
          analyserNode.smoothingTimeConstant = 0.8
          analyserNode.fftSize = 256
          
          microphone.connect(analyserNode)
          
          setAudioContext(context)
          setAnalyser(analyserNode)
          setMicrophone(stream)
        } catch (error) {
          console.error("Error accessing microphone:", error)
        }
      }
      
      initAudio()
    } else {
      // Cleanup
      if (microphone) {
        microphone.getTracks().forEach(track => track.stop())
      }
      if (audioContext) {
        audioContext.close()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      setVolumes(Array(barCount).fill(0))
    }
    
    return () => {
      if (microphone) {
        microphone.getTracks().forEach(track => track.stop())
      }
      if (audioContext) {
        audioContext.close()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive, barCount])

  useEffect(() => {
    if (analyser && isActive) {
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      const updateVolumes = () => {
        analyser.getByteFrequencyData(dataArray)
        
        // Group frequencies into bars
        const barsData: number[] = []
        const barSize = Math.floor(bufferLength / barCount)
        
        for (let i = 0; i < barCount; i++) {
          let sum = 0
          const offset = i * barSize
          
          for (let j = 0; j < barSize; j++) {
            sum += dataArray[offset + j]
          }
          
          const average = sum / barSize
          const normalizedHeight = (average / 255) * (maxHeight - minHeight) + minHeight
          barsData.push(normalizedHeight)
        }
        
        setVolumes(barsData)
        animationFrameRef.current = requestAnimationFrame(updateVolumes)
      }
      
      updateVolumes()
    }
  }, [analyser, isActive, barCount, minHeight, maxHeight])

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <AnimatePresence>
        {isActive ? (
          <>
            {volumes.map((height, index) => (
              <motion.div
                key={index}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                exit={{ scaleY: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <motion.div
                  animate={{ height }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 20,
                    mass: 0.5
                  }}
                  style={{ 
                    width: 3,
                    backgroundColor: color,
                    minHeight: `${minHeight}px`
                  }}
                  className="rounded-full"
                />
              </motion.div>
            ))}
          </>
        ) : (
          // Idle state bars
          <>
            {Array(barCount).fill(0).map((_, index) => (
              <motion.div
                key={`idle-${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                style={{ 
                  width: 3,
                  height: minHeight,
                  backgroundColor: color
                }}
                className="rounded-full"
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Animated circular visualizer variant
interface CircularVisualizerProps {
  isActive: boolean
  className?: string
  size?: number
  color?: string
}

export function CircularVisualizer({
  isActive,
  className,
  size = 48,
  color = "rgb(59, 130, 246)"
}: CircularVisualizerProps) {
  const [scale, setScale] = useState(1)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [microphone, setMicrophone] = useState<MediaStream | null>(null)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    if (isActive) {
      const initAudio = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          const context = new AudioContext()
          const analyserNode = context.createAnalyser()
          const microphone = context.createMediaStreamSource(stream)
          
          analyserNode.smoothingTimeConstant = 0.85
          analyserNode.fftSize = 256
          
          microphone.connect(analyserNode)
          
          setAudioContext(context)
          setAnalyser(analyserNode)
          setMicrophone(stream)
        } catch (error) {
          console.error("Error accessing microphone:", error)
        }
      }
      
      initAudio()
    } else {
      if (microphone) {
        microphone.getTracks().forEach(track => track.stop())
      }
      if (audioContext) {
        audioContext.close()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      setScale(1)
    }
    
    return () => {
      if (microphone) {
        microphone.getTracks().forEach(track => track.stop())
      }
      if (audioContext) {
        audioContext.close()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive])

  useEffect(() => {
    if (analyser && isActive) {
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      const updateScale = () => {
        analyser.getByteFrequencyData(dataArray)
        
        // Calculate average volume
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const average = sum / bufferLength
        const normalizedScale = 1 + (average / 255) * 0.5 // Scale between 1 and 1.5
        
        setScale(normalizedScale)
        animationFrameRef.current = requestAnimationFrame(updateScale)
      }
      
      updateScale()
    }
  }, [analyser, isActive])

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence>
        {isActive && (
          <>
            {/* Outer pulsing ring */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: size,
                height: size,
                borderColor: color,
                position: 'absolute',
                inset: 0
              }}
              className="rounded-full border-2"
            />
            
            {/* Middle responsive ring */}
            <motion.div
              animate={{ scale }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{
                width: size * 0.7,
                height: size * 0.7,
                backgroundColor: color,
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
              className="rounded-full opacity-20"
            />
          </>
        )}
      </AnimatePresence>
      
      {/* Center dot */}
      <motion.div
        animate={{ 
          scale: isActive ? [1, 1.1, 1] : 1,
          opacity: isActive ? 1 : 0.5
        }}
        transition={{ 
          duration: 0.8, 
          repeat: isActive ? Infinity : 0 
        }}
        style={{
          width: size * 0.3,
          height: size * 0.3,
          backgroundColor: color,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
        className="rounded-full"
      />
    </div>
  )
}