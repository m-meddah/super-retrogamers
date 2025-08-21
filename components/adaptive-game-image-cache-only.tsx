'use client'

import Image from "next/image"
import { useState, useEffect } from "react"
import { useCurrentRegion } from '@/lib/hooks/use-persistent-region'
import { getBestCachedMediaUrlOnly } from '@/lib/media-url-cache'
import type { Game, Console } from "@prisma/client"

interface GameWithConsole extends Game {
  console?: Console | null
}

interface AdaptiveGameImageCacheOnlyProps {
  game: GameWithConsole
  className?: string
  alt?: string
  priority?: boolean
}

export default function AdaptiveGameImageCacheOnly({ 
  game: gameData, 
  className, 
  alt,
  priority = false
}: AdaptiveGameImageCacheOnlyProps) {
  const currentRegion = useCurrentRegion()
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg")
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  
  useEffect(() => {
    async function loadImageFromCacheOnly() {
      setIsLoading(true)
      setImageError(false)
      try {
        // Utilisation de la fonction cache-only pour éviter les appels API
        const mediaTypes = ['box-2D', 'box-2D-back', 'box-2D-side', 'wheel-carbon', 'wheel-steel', 'screenmarquee', 'support-2D', 'mixrbv2']
        const regionPriority = [currentRegion, 'WOR', 'EU', 'US', 'JP', 'FR', 'ASI']
        
        const url = await getBestCachedMediaUrlOnly('game', gameData.id, mediaTypes, regionPriority)
        if (url) {
          setImageUrl(url)
        } else {
          // Pas d'image trouvée en cache, laisser le placeholder
          setImageError(true)
        }
      } catch (error) {
        console.error(`Erreur chargement image cache-only ${gameData.slug}:`, error)
        setImageError(true)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadImageFromCacheOnly()
  }, [gameData.id, gameData.slug, currentRegion])

  const handleImageError = () => {
    setImageError(true)
  }

  if (imageError) {
    return (
      <div className={`aspect-[3/4] bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className || ''}`}>
        <svg className="h-8 w-8 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    )
  }

  return (
    <div className={`relative aspect-[3/4] ${className || ''}`}>
      <Image
        src={imageUrl}
        alt={alt || gameData.title}
        fill
        className={`object-contain ${isLoading ? 'opacity-50' : 'opacity-100'}`}
        onError={handleImageError}
        priority={priority}
      />
    </div>
  )
}