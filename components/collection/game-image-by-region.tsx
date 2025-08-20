'use client'

import Image from "next/image"
import { getCachedMediaUrl } from '@/lib/media-url-cache'
import type { Game, GameVariant, Console } from "@prisma/client"
import { useEffect, useState } from 'react'

interface GameWithConsole extends Game {
  console: Console
}

interface GameVariantExtended extends GameVariant {
  game: GameWithConsole
}

interface GameImageByRegionProps {
  game?: GameWithConsole
  variant?: GameVariantExtended
  className?: string
  alt?: string
}

export default function GameImageByRegion({ 
  game: gameData, 
  variant, 
  className, 
  alt 
}: GameImageByRegionProps) {
  // Utiliser le variant si disponible, sinon le jeu direct
  const targetGame = variant?.game || gameData
  const targetRegion = variant?.region || 'FR' // Region du variant ou défaut
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg")
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function loadImage() {
      if (!targetGame) {
        setIsLoading(false)
        return
      }
      
      setIsLoading(true)
      try {
        // Priorité des types de médias pour les jeux
        const mediaTypes = ['box-2D', 'box-3D', 'wheel', 'sstitle', 'ss']
        
        for (const mediaType of mediaTypes) {
          const url = await getCachedMediaUrl('game', targetGame.id, mediaType, targetRegion)
          if (url) {
            setImageUrl(url)
            break
          }
        }
      } catch (error) {
        console.error(`Erreur chargement image jeu ${targetGame.slug}:`, error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadImage()
  }, [targetGame?.id, targetGame, targetRegion])
  
  if (!targetGame) {
    return (
      <Image
        src="/placeholder.svg"
        alt={alt || "Jeu"}
        fill
        className={className || "object-cover"}
      />
    )
  }
  
  return (
    <Image
      src={imageUrl}
      alt={alt || targetGame.title}
      fill
      className={`${className || "object-cover"} ${isLoading ? 'opacity-50' : 'opacity-100'}`}
    />
  )
}