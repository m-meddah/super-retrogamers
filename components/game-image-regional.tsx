'use client'

import Image from "next/image"
import { useCurrentRegion } from '@/lib/hooks/use-persistent-region'
import { selectBestGameImage } from "@/lib/regional-preferences"
import type { Game, GameMedia, Console } from "@prisma/client"

interface GameWithMedias extends Game {
  medias?: GameMedia[]
  console?: Console | null
}

interface GameImageRegionalProps {
  game: GameWithMedias
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
  const preferredRegionLowercase = currentRegion.toLowerCase()
  
  // Transformer le jeu en format RegionalGameData
  const regionalGame = {
    id: gameData.id,
    title: gameData.title,
    slug: gameData.slug,
    consoleId: gameData.console?.slug || '',
    releaseYear: gameData.releaseYear,
    description: gameData.description,
    image: null, // Image column removed, using regional media only
    medias: (gameData.medias || []).map(media => ({
      id: `${media.mediaType}-${media.region}`,
      mediaType: media.mediaType,
      region: media.region,
      url: media.localPath || '',
      localPath: media.localPath,
      fileName: media.localPath ? media.localPath.split('/').pop() || '' : ''
    })),
    // Dates régionales (à implémenter si nécessaire)
    releaseDateEU: null,
    releaseDateFR: null,
    releaseDateJP: null,
    releaseDateUS: null,
    releaseDateWOR: null
  }
  
  const imageUrl = selectBestGameImage(regionalGame, preferredRegionLowercase) || "/placeholder.svg"
  
  return (
    <Image
      src={imageUrl}
      alt={alt || gameData.title}
      width={width}
      height={height}
      className={className || "h-full w-full object-cover"}
    />
  )
}