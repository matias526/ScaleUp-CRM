"use client"

import type React from "react"

import { useState } from "react"
import Image, { type ImageProps } from "next/image"
import { Building } from "lucide-react"

interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
  fallback?: React.ReactNode
}

export function ImageWithFallback({
  fallback = <Building className="h-5 w-5 text-muted-foreground" />,
  alt,
  src,
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false)

  if (error || !src) {
    return <div className="w-full h-full flex items-center justify-center bg-muted">{fallback}</div>
  }

  return <Image alt={alt} src={src || "/placeholder.svg"} {...props} onError={() => setError(true)} />
}
