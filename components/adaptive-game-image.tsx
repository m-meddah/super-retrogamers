'use client'

import Image from "next/image"
import { useState } from "react"
import { useCurrentRegion } from '@/lib/hooks/use-persistent-region'
import { selectBestGameImage, selectBestGameMedia } from "@/lib/regional-preferences"
import type { Game, GameMedia, Console } from "@prisma/client"

interface GameWithMedias extends Game {
  medias?: GameMedia[]
  console?: Console | null
}

interface AdaptiveGameImageProps {
  game: GameWithMedias
  className?: string
  alt?: string
  showWheel?: boolean
  priority?: boolean
}

export default function AdaptiveGameImage({ 
  game: gameData, 
  className, 
  alt,
  showWheel = false,
  priority = false
}: AdaptiveGameImageProps) {
  const currentRegion = useCurrentRegion()
  const preferredRegionLowercase = currentRegion.toLowerCase()
  const [imageError, setImageError] = useState(false)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  
  // Transformer le jeu en format RegionalGameData
  const regionalGame = {
    id: gameData.id,
    title: gameData.title,
    slug: gameData.slug,
    consoleId: gameData.console?.slug || '',
    releaseYear: gameData.releaseYear,
    description: gameData.description,
    image: null,
    medias: (gameData.medias || []).map(media => ({
      id: `${media.mediaType}-${media.region}`,
      mediaType: media.mediaType,
      region: media.region,
      url: media.localPath || '',
      localPath: media.localPath,
      fileName: media.localPath ? media.localPath.split('/').pop() || '' : ''
    })),
    releaseDateEU: null,
    releaseDateFR: null,
    releaseDateJP: null,
    releaseDateUS: null,
    releaseDateWOR: null
  }
  
  // Obtenir l'image principale (box art)
  const imageUrl = selectBestGameImage(regionalGame, preferredRegionLowercase) || "/placeholder.svg"
  
  // Obtenir l'image wheel (logo) si demandée
  const wheelMedia = showWheel ? selectBestGameMedia(regionalGame.medias, 'wheel', preferredRegionLowercase) : null
  const wheelUrl = wheelMedia?.localPath

  // Fonction pour déterminer le style d'aspect basé sur les dimensions de l'image
  const getAspectRatioClass = () => {
    if (!imageDimensions) return "aspect-[3/4]" // ratio par défaut

    const { width, height } = imageDimensions
    const ratio = width / height

    // Déterminer le format basé sur le ratio
    if (ratio > 1.2) {
      // Image horizontale (comme les jeux SNES EU/US)
      return "aspect-[4/3]"
    } else if (ratio > 0.9 && ratio <= 1.1) {
      // Image carrée (comme les jeux SuperGrafx)
      return "aspect-square"
    } else if (ratio <= 0.8) {
      // Image verticale (comme les jeux SNES JP)
      return "aspect-[2/3]"
    } else {
      // Ratio standard
      return "aspect-[3/4]"
    }
  }

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    })
  }

  const handleImageError = () => {
    setImageError(true)
  }

  if (imageError) {
    return (
      <div className={`${getAspectRatioClass()} bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className || ''}`}>
        <span className="text-gray-500 dark:text-gray-400 text-sm">Image indisponible</span>
      </div>
    )
  }

  return (
    <div className={`relative ${getAspectRatioClass()} ${className || ''}`}>
      {/* Image principale */}
      <Image
        src={imageUrl}
        alt={alt || gameData.title}
        fill
        className="object-contain"
        onLoad={handleImageLoad}
        onError={handleImageError}
        priority={priority}
      />
      
      {/* Overlay wheel (logo) si disponible et demandé */}
      {showWheel && wheelUrl && (
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2">
            <Image
              src={wheelUrl}
              alt={`${gameData.title} logo`}
              width={80}
              height={40}
              className="object-contain max-h-10"
            />
          </div>
        </div>
      )}
    </div>
  )
}