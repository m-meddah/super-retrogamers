'use client'

import { Suspense } from 'react'
import RegionalLink from "@/components/regional-link"
import Image from "next/image"
import type { Console, ConsoleMedia } from "@prisma/client"
import { selectBestConsoleImage } from "@/lib/regional-preferences"

interface ConsoleWithMedias extends Console {
  medias?: ConsoleMedia[]
}

interface ConsoleCardWrapperProps {
  console: ConsoleWithMedias
  preferredRegion?: string
}

export default function ConsoleCardWrapper({ console: consoleData, preferredRegion = 'fr' }: ConsoleCardWrapperProps) {
  // Transformer la console en format RegionalConsoleData pour la fonction selectBestConsoleImage
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
  
  const imageUrl = selectBestConsoleImage(regionalConsole, preferredRegion) || "/placeholder.svg"
  
  console.log(`[ConsoleCardWrapper] Console ${consoleData.slug} - PreferredRegion: ${preferredRegion}, ImageURL: ${imageUrl}`)
  
  return (
    <Suspense fallback={
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
        </div>
      </div>
    }>
      <RegionalLink href={`/consoles/${consoleData.slug}`} className="group block">
        <article className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700">
          {/* Image */}
          <div className="aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
            <Image 
              src={imageUrl} 
              alt={consoleData.name}
              width={400}
              height={300}
              className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </div>
          
          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-medium text-gray-900 dark:text-white line-clamp-2 leading-tight">
                {consoleData.name}
              </h3>
              {consoleData.releaseYear && (
                <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  {consoleData.releaseYear}
                </span>
              )}
            </div>
            
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {consoleData.manufacturer}
            </p>
            
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500 line-clamp-2 leading-relaxed">
              {consoleData.description}
            </p>
          </div>
        </article>
      </RegionalLink>
    </Suspense>
  )
}