'use client'

import Image from "next/image"
import { useCurrentRegion } from '@/lib/hooks/use-persistent-region'
import { selectBestGameMedia } from "@/lib/regional-preferences"
import type { Game, GameMedia, Console } from "@prisma/client"

interface GameWithMedias extends Game {
  medias?: GameMedia[]
  console?: Console | null
}

interface GameWheelLogoProps {
  game: GameWithMedias
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showTitle?: boolean
}

export default function GameWheelLogo({ 
  game: gameData, 
  className = '',
  size = 'md',
  showTitle = false
}: GameWheelLogoProps) {
  const currentRegion = useCurrentRegion()
  const preferredRegionLowercase = currentRegion.toLowerCase()
  
  // Transformer le jeu en format pour la sélection de média
  const regionalMedias = (gameData.medias || []).map(media => ({
    id: `${media.mediaType}-${media.region}`,
    mediaType: media.mediaType,
    region: media.region,
    url: media.localPath || '',
    localPath: media.localPath,
    fileName: media.localPath ? media.localPath.split('/').pop() || '' : ''
  }))
  
  // Obtenir l'image wheel (logo)
  const wheelMedia = selectBestGameMedia(regionalMedias, 'wheel', preferredRegionLowercase)
  
  if (!wheelMedia?.localPath) {
    return null // Pas de logo disponible
  }

  // Définir les tailles selon le paramètre size
  const sizeClasses = {
    sm: 'h-8 max-w-20',
    md: 'h-12 max-w-32',
    lg: 'h-16 max-w-40'
  }

  const sizePixels = {
    sm: { width: 80, height: 32 },
    md: { width: 128, height: 48 },
    lg: { width: 160, height: 64 }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <Image
          src={wheelMedia.localPath}
          alt={`${gameData.title} logo`}
          width={sizePixels[size].width}
          height={sizePixels[size].height}
          className="object-contain h-full w-full"
        />
      </div>
      {showTitle && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {gameData.title}
        </span>
      )}
    </div>
  )
}