'use client'

import Image from "next/image"
import { selectBestConsoleImage } from "@/lib/regional-preferences"
import type { Console, ConsoleMedia, ConsoleVariant } from "@prisma/client"

interface ConsoleWithMedias extends Console {
  medias?: ConsoleMedia[]
}

interface ConsoleVariantExtended extends ConsoleVariant {
  console: ConsoleWithMedias
}

interface ConsoleImageByRegionProps {
  console?: ConsoleWithMedias
  variant?: ConsoleVariantExtended
  className?: string
  alt?: string
}

export default function ConsoleImageByRegion({ 
  console: consoleData, 
  variant, 
  className, 
  alt 
}: ConsoleImageByRegionProps) {
  // Utiliser le variant si disponible, sinon la console directe
  const targetConsole = variant?.console || consoleData
  const targetRegion = variant?.region || 'FR' // Region du variant ou défaut
  
  if (!targetConsole) {
    return (
      <Image
        src="/placeholder.svg"
        alt={alt || "Console"}
        fill
        className={className || "object-cover"}
      />
    )
  }
  
  // Transformer en format RegionalConsoleData
  const regionalConsole = {
    id: targetConsole.id,
    name: targetConsole.name,
    slug: targetConsole.slug,
    manufacturer: targetConsole.manufacturer,
    releaseYear: targetConsole.releaseYear,
    description: targetConsole.description || '',
    image: null, // Image column removed, using regional media only
    medias: (targetConsole.medias || []).map(media => ({
      id: media.id,
      type: media.type,
      region: media.region,
      url: media.url,
      localPath: media.localPath,
      format: media.format,
      fileName: media.fileName
    }))
  }
  
  // Utiliser la région spécifique du variant (pas les préférences utilisateur)
  const imageUrl = selectBestConsoleImage(regionalConsole, targetRegion.toLowerCase()) || "/placeholder.svg"
  
  console.log(`[ConsoleImageByRegion] Console ${targetConsole.slug} - VariantRegion: ${targetRegion}, ImageURL: ${imageUrl}`)
  
  return (
    <Image
      src={imageUrl}
      alt={alt || targetConsole.name}
      fill
      className={className || "object-cover"}
    />
  )
}