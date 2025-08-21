'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { getBestCachedMediaUrl } from '@/lib/media-url-cache'
import type { GameWithConsole } from '@/lib/data-prisma'

interface OptimizedGameImageProps {
  game: GameWithConsole
  priority?: boolean
  className?: string
  sizes?: string
}

export function OptimizedGameImage({ 
  game, 
  priority = false, 
  className = "aspect-[3/4] overflow-hidden rounded-lg",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
}: OptimizedGameImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('/placeholder-game.svg')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Fetch l'URL optimale au montage du composant
  useEffect(() => {
    const loadOptimalImage = async () => {
      try {
        setIsLoading(true)
        setHasError(false)

        // Ordre de priorité pour les types d'images
        const priorityOrder = ['box-2D', 'wheel', 'sstitle', 'ss']
        const regions = ['FR', 'EU', 'WOR', 'US', 'JP']

        // Utiliser getBestCachedMediaUrl pour une seule requête optimisée
        const bestImageUrl = await getBestCachedMediaUrl('game', game.id, priorityOrder, regions)

        if (bestImageUrl) {
          setImageSrc(bestImageUrl)
        }
        // Plus de fallback vers médias locaux - utilisation du placeholder uniquement
      } catch (error) {
        console.error('Erreur lors du chargement de l\'image:', error)
        setHasError(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadOptimalImage()
  }, [game.id])

  const handleImageLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setHasError(true)
    
    // Fallback vers placeholder
    if (imageSrc !== '/placeholder-game.svg') {
      setImageSrc('/placeholder-game.svg')
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Image
        src={imageSrc}
        alt={game.title}
        fill
        className={`object-cover transition-all duration-300 ${
          isLoading 
            ? 'opacity-0 scale-110' 
            : hasError 
              ? 'opacity-50 grayscale' 
              : 'opacity-100 scale-100'
        }`}
        priority={priority}
        sizes={sizes}
        onLoad={handleImageLoad}
        onError={handleImageError}
        // Optimisations Next.js pour images externes
        unoptimized={imageSrc.includes('screenscraper.fr')}
      />
      
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg 
              className="w-8 h-8 mx-auto mb-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <p className="text-xs">Image non disponible</p>
          </div>
        </div>
      )}
    </div>
  )
}

// getBestLocalGameImage supprimée - plus de médias locaux avec le cache d'URLs

/**
 * Hook pour précharger les images importantes
 */
export function usePreloadGameImages(games: GameWithConsole[], count: number = 5) {
  useEffect(() => {
    const preloadImages = async () => {
      const topGames = games.slice(0, count)
      
      for (const game of topGames) {
        try {
          // Précharge l'URL pour les premiers jeux
          await getBestCachedMediaUrl('game', game.id, ['box-2D'], ['FR'])
        } catch {
          // Ignore silently
        }
      }
    }

    preloadImages()
  }, [games, count])
}