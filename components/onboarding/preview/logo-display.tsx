"use client"

import Image from "next/image"
import { useState } from "react"

interface LogoDisplayProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  containerClassName?: string
}

export function LogoDisplay({ src, alt, width, height, className = "", containerClassName = "" }: LogoDisplayProps) {
  const [error, setError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  if (error || !src) {
    return (
      <div className={`${containerClassName} flex items-center justify-center`}>
        <div className="text-xs text-slate-500 bg-slate-100 rounded px-2 py-1">Logo</div>
      </div>
    )
  }

  return (
    <div className={containerClassName}>
      {!imageLoaded && (
        <div className={`${className} bg-slate-200 animate-pulse rounded`} style={{ width, height }} />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${imageLoaded ? '' : 'hidden'}`}
        onError={() => setError(true)}
        onLoad={() => setImageLoaded(true)}
        unoptimized={src.startsWith('data:')}
        priority
      />
    </div>
  )
}