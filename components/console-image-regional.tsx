'use client'

import Image from "next/image"
import { useCurrentRegion } from '@/lib/hooks/use-persistent-region'
import { getBestCachedMediaUrl } from '@/lib/media-url-cache'
import type { Console } from "@prisma/client"
import { useEffect, useState } from 'react'

interface ConsoleImageRegionalProps {
  console: Console
  className?: string
  alt?: string
}

export default function ConsoleImageRegional({ console: consoleData, className, alt }: ConsoleImageRegionalProps) {
  const currentRegion = useCurrentRegion()
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg")
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function loadImage() {
      setIsLoading(true)
      try {
        // Utilisation de la fonction optimisée
        const mediaTypes = ['wheel', 'logo-svg', 'photo', 'illustration']
        const regionPriority = [currentRegion, 'WOR', 'EU', 'US', 'JP', 'FR', 'ASI']
        
        const url = await getBestCachedMediaUrl('console', consoleData.id, mediaTypes, regionPriority)
        if (url) {
          setImageUrl(url)
        }
      } catch (error) {
        console.error(`Erreur chargement image console ${consoleData.slug}:`, error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadImage()
  }, [consoleData.id, consoleData.slug, currentRegion])
  
  return (
    <Image
      src={imageUrl}
      alt={alt || consoleData.name}
      fill
      className={`${className || "object-contain p-8 transition-transform duration-300 hover:scale-105"} ${isLoading ? 'opacity-50' : 'opacity-100'}`}
    />
  )
}