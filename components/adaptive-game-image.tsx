'use client'

import Image from "next/image"
import { useState, useEffect } from "react"
import { useCurrentRegion } from '@/lib/hooks/use-persistent-region'
import { getBestCachedMediaUrl } from '@/lib/media-url-cache'
import type { Game, Console } from "@prisma/client"

interface GameWithConsole extends Game {
  console?: Console | null
}

interface AdaptiveGameImageProps {
  game: GameWithConsole
  className?: string
  alt?: string
  priority?: boolean
}

export default function AdaptiveGameImage({ 
  game: gameData, 
  className, 
  alt,
  priority = false
}: AdaptiveGameImageProps) {
  const currentRegion = useCurrentRegion()
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg")
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  
  useEffect(() => {
    async function loadImage() {
      setIsLoading(true)
      setImageError(false)
      try {
        // Utilisation de la fonction optimisée pour les jeux
        const mediaTypes = ['box-2D', 'box-3D', 'wheel', 'sstitle', 'ss']
        const regionPriority = [currentRegion, 'WOR', 'EU', 'US', 'JP', 'FR', 'ASI']
        
        const url = await getBestCachedMediaUrl('game', gameData.id, mediaTypes, regionPriority)
        if (url) {
          setImageUrl(url)
        }
      } catch (error) {
        console.error(`Erreur chargement image jeu ${gameData.slug}:`, error)
        setImageError(true)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadImage()
  }, [gameData.id, gameData.slug, currentRegion])

  const handleImageError = () => {
    setImageError(true)
  }

  if (imageError) {
    return (
      <div className={`aspect-[3/4] bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className || ''}`}>
        <span className="text-gray-500 dark:text-gray-400 text-sm">Image indisponible</span>
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