'use client'

import Image from "next/image"
import { getBestCachedMediaUrl } from '@/lib/media-url-cache'
import type { Console, ConsoleVariant } from "@prisma/client"
import { useEffect, useState } from 'react'

interface ConsoleVariantExtended extends ConsoleVariant {
  console: Console
}

interface ConsoleImageByRegionProps {
  console?: Console
  variant?: ConsoleVariantExtended
  className?: string
  alt?: string
}

export default function ConsoleImageByRegion({ 
  console: consoleData, 
  variant, 
  className, 
  alt 
}: ConsoleImageByRegionProps) {
  // Utiliser le variant si disponible, sinon la console directe
  const targetConsole = variant?.console || consoleData
  const targetRegion = variant?.region?.toLowerCase() || 'fr' // Region du variant ou défaut
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg")
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function loadImage() {
      if (!targetConsole) {
        setIsLoading(false)
        return
      }
      
      setIsLoading(true)
      try {
        // Utilisation de la fonction optimisée
        const mediaTypes = ['wheel', 'logo-svg', 'photo', 'illustration']
        const regionPriority = [targetRegion, 'wor', 'eu', 'us', 'jp', 'fr', 'asi']
        
        const url = await getBestCachedMediaUrl('console', targetConsole.id, mediaTypes, regionPriority)
        if (url) {
          setImageUrl(url)
        }
      } catch (error) {
        console.error(`Erreur chargement image console ${targetConsole.slug}:`, error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadImage()
  }, [targetConsole?.id, targetConsole, targetRegion])
  
  if (!targetConsole) {
    return (
      <Image
        src="/placeholder.svg"
        alt={alt || "Console"}
        fill
        className={className || "object-cover"}
      />
    )
  }
  
  return (
    <Image
      src={imageUrl}
      alt={alt || targetConsole.name}
      fill
      className={`${className || "object-cover"} ${isLoading ? 'opacity-50' : 'opacity-100'}`}
    />
  )
}