'use client'

import Image from "next/image"
import { useCurrentRegion } from '@/lib/hooks/use-regional-preferences'
import { selectBestConsoleImage } from "@/lib/regional-preferences"
import type { Console, ConsoleMedia } from "@prisma/client"

interface ConsoleWithMedias extends Console {
  medias?: ConsoleMedia[]
}

interface ConsoleImageRegionalProps {
  console: ConsoleWithMedias
  className?: string
  alt?: string
}

export default function ConsoleImageRegional({ console: consoleData, className, alt }: ConsoleImageRegionalProps) {
  const currentRegion = useCurrentRegion()
  const preferredRegionLowercase = currentRegion.toLowerCase()
  
  // Transformer la console en format RegionalConsoleData
  const regionalConsole = {
    id: consoleData.id,
    name: consoleData.name,
    slug: consoleData.slug,
    manufacturer: consoleData.manufacturer,
    releaseYear: consoleData.releaseYear,
    description: consoleData.description || '',
    image: consoleData.image,
    medias: (consoleData.medias || []).map(media => ({
      id: media.id,
      type: media.type,
      region: media.region,
      url: media.url,
      localPath: media.localPath,
      format: media.format,
      fileName: media.fileName
    }))
  }
  
  const imageUrl = selectBestConsoleImage(regionalConsole, preferredRegionLowercase) || "/placeholder.svg"
  
  console.log(`[ConsoleImageRegional] Console ${consoleData.slug} - Region: ${currentRegion}, ImageURL: ${imageUrl}`)
  
  return (
    <Image
      src={imageUrl}
      alt={alt || consoleData.name}
      fill
      className={className || "object-contain p-8 transition-transform duration-300 hover:scale-105"}
    />
  )
}