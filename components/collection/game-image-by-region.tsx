'use client'

import Image from "next/image"
import { selectBestGameImage } from "@/lib/regional-preferences"
import type { Game, GameMedia, GameVariant, Console } from "@prisma/client"

interface GameWithMedias extends Game {
  medias?: GameMedia[]
  console: Console
}

interface GameVariantExtended extends GameVariant {
  game: GameWithMedias
}

interface GameImageByRegionProps {
  game?: GameWithMedias
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
  
  // Transformer en format RegionalGameData
  const regionalGame = {
    id: targetGame.id,
    title: targetGame.title,
    slug: targetGame.slug,
    consoleId: targetGame.console?.slug || '',
    releaseYear: targetGame.releaseYear,
    description: targetGame.description,
    image: null, // Image column removed, using regional media only
    medias: (targetGame.medias || []).map(media => ({
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
  
  // Utiliser la région spécifique du variant (pas les préférences utilisateur)
  const imageUrl = selectBestGameImage(regionalGame, targetRegion.toLowerCase()) || "/placeholder.svg"
  
  console.log(`[GameImageByRegion] Game ${targetGame.slug} - VariantRegion: ${targetRegion}, ImageURL: ${imageUrl}`)
  
  return (
    <Image
      src={imageUrl}
      alt={alt || targetGame.title}
      fill
      className={className || "object-cover"}
    />
  )
}