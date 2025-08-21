'use client'

import Image from "next/image"
import { useState, useEffect } from "react"
import { useCurrentRegion } from '@/lib/hooks/use-persistent-region'
import { getBestCachedMediaUrl, getBestCachedMediaUrlOnly } from '@/lib/media-url-cache'
import type { Game, Console } from "@prisma/client"

interface GameWithConsole extends Game {
  console?: Console | null
}

interface GameWheelLogoProps {
  game: GameWithConsole
  className?: string
  alt?: string
  priority?: boolean
  cacheOnly?: boolean // Si true, ne fait aucun appel API
}

export default function GameWheelLogo({ 
  game: gameData, 
  className, 
  alt,
  priority = false,
  cacheOnly = false
}: GameWheelLogoProps) {
  const currentRegion = useCurrentRegion()
  const [logoUrl, setLogoUrl] = useState<string>("/placeholder.svg")
  const [isLoading, setIsLoading] = useState(true)
  const [logoError, setLogoError] = useState(false)
  
  useEffect(() => {
    async function loadLogo() {
      setIsLoading(true)
      setLogoError(false)
      try {
        // Priorité des types de médias pour les logos de jeux
        const mediaTypes = ['wheel', 'wheel-carbon', 'wheel-steel', 'screenmarquee', 'logo-svg']
        const regionPriority = [currentRegion, 'WOR', 'EU', 'US', 'JP', 'FR', 'ASI']
        
        // Utiliser cache-only si demandé, sinon utiliser la fonction normale
        const url = cacheOnly 
          ? await getBestCachedMediaUrlOnly('game', gameData.id, mediaTypes, regionPriority)
          : await getBestCachedMediaUrl('game', gameData.id, mediaTypes, regionPriority)
        
        if (url) {
          setLogoUrl(url)
        }
      } catch (error) {
        console.error(`Erreur chargement logo jeu ${gameData.slug}:`, error)
        setLogoError(true)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadLogo()
  }, [gameData.id, gameData.slug, currentRegion, cacheOnly])

  const handleLogoError = () => {
    setLogoError(true)
  }

  if (logoError) {
    return (
      <div className={`aspect-[3/1] bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded ${className || ''}`}>
        <span className="text-gray-500 dark:text-gray-400 text-sm">Logo indisponible</span>
      </div>
    )
  }

  return (
    <div className={`relative aspect-[3/1] ${className || ''}`}>
      <Image
        src={logoUrl}
        alt={alt || `Logo ${gameData.title}`}
        fill
        className={`object-contain ${isLoading ? 'opacity-50' : 'opacity-100'}`}
        onError={handleLogoError}
        priority={priority}
      />
    </div>
  )
}