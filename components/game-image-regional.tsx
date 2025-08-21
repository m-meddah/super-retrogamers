'use client'

import Image from "next/image"
import { useCurrentRegion } from '@/lib/hooks/use-persistent-region'
import { getBestCachedMediaUrl } from '@/lib/media-url-cache'
import type { Game, Console } from "@prisma/client"
import { useEffect, useState } from 'react'

interface GameWithConsole extends Game {
  console?: Console | null
}

interface GameImageRegionalProps {
  game: GameWithConsole
  className?: string
  alt?: string
  width?: number
  height?: number
}

export default function GameImageRegional({ 
  game: gameData, 
  className, 
  alt,
  width = 300,
  height = 400
}: GameImageRegionalProps) {
  const currentRegion = useCurrentRegion()
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg")
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function loadImage() {
      setIsLoading(true)
      try {
        // Priorité des types de médias pour les jeux
        const mediaTypes = ['box-2D', 'box-3D', 'wheel', 'sstitle', 'ss']
        
        const url = await getBestCachedMediaUrl('game', gameData.id, mediaTypes, [currentRegion])
        if (url) {
          setImageUrl(url)
        }
      } catch (error) {
        console.error(`Erreur chargement image jeu ${gameData.slug}:`, error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadImage()
  }, [gameData.id, gameData.slug, currentRegion])
  
  return (
    <Image
      src={imageUrl}
      alt={alt || gameData.title}
      width={width}
      height={height}
      className={`${className || "h-full w-full object-cover"} ${isLoading ? 'opacity-50' : 'opacity-100'}`}
    />
  )
}