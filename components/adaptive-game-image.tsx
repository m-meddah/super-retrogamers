'use client'

import Image from "next/image"
import { useState, useEffect } from "react"
import { useCurrentRegion } from '@/lib/hooks/use-persistent-region'
import { getBestCachedMediaUrl, getBestCachedMediaUrlOnly } from '@/lib/media-url-cache'
import type { Game, Console } from "@prisma/client"

interface GameWithConsole extends Game {
  console?: Console | null
}

// Interface pour les résultats de recherche Screenscraper
interface ScreenscraperGameResult {
  id: string
  slug: string
  title: string
  screenscraper_image_url?: string
}

interface AdaptiveGameImageProps {
  game: GameWithConsole | ScreenscraperGameResult
  className?: string
  alt?: string
  priority?: boolean
  cacheOnly?: boolean // Si true, ne fait aucun appel API
}

export default function AdaptiveGameImage({ 
  game: gameData, 
  className, 
  alt,
  priority = false,
  cacheOnly = false
}: AdaptiveGameImageProps) {
  const currentRegion = useCurrentRegion()
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg")
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  
  // Détecter si c'est un résultat Screenscraper
  const isScreenscraperResult = 'screenscraper_image_url' in gameData
  
  useEffect(() => {
    async function loadImage() {
      setIsLoading(true)
      setImageError(false)
      try {
        // Si c'est un résultat Screenscraper avec une URL d'image, l'utiliser directement
        if (isScreenscraperResult && gameData.screenscraper_image_url) {
          setImageUrl(gameData.screenscraper_image_url)
          setIsLoading(false)
          return
        }
        
        // Sinon, utiliser la logique normale pour les jeux en base
        if ('id' in gameData && gameData.id) {
          const mediaTypes = ['box-2D', 'box-3D', 'wheel', 'sstitle', 'ss']
          const regionPriority = [currentRegion, 'WOR', 'EU', 'US', 'JP', 'FR', 'ASI']
          
          // Utiliser cache-only si demandé, sinon utiliser la fonction normale
          const url = cacheOnly 
            ? await getBestCachedMediaUrlOnly('game', gameData.id, mediaTypes, regionPriority)
            : await getBestCachedMediaUrl('game', gameData.id, mediaTypes, regionPriority)
          
          if (url) {
            setImageUrl(url)
          }
        }
      } catch (error) {
        console.error(`Erreur chargement image jeu ${gameData.slug}:`, error)
        setImageError(true)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadImage()
  }, [gameData.id, gameData.slug, currentRegion, cacheOnly, isScreenscraperResult, 'screenscraper_image_url' in gameData ? gameData.screenscraper_image_url : undefined])

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
        className={`object-contain p-2 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
        onError={handleImageError}
        priority={priority}
      />
    </div>
  )
}