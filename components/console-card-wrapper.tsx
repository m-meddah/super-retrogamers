'use client'

import { Suspense, useEffect, useState } from 'react'
import RegionalLink from "@/components/regional-link"
import Image from "next/image"
import type { Console } from "@prisma/client"
import { getBestCachedMediaUrl } from '@/lib/media-url-cache'
// Hooks régionaux retirés pour optimiser les performances sur pages avec multiples consoles
import { useCurrentRegion } from '@/lib/hooks/use-regional-preferences'

interface ConsoleCardWrapperProps {
  console: Console
  preferredRegion?: string
}

export default function ConsoleCardWrapper({ console: consoleData }: ConsoleCardWrapperProps) {
  // Utilisation directe des données de base pour éviter les appels multiples
  const currentRegion = useCurrentRegion()
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg")
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function loadImage() {
      setIsLoading(true)
      try {
        // Types de médias élargis pour consoles (ordre de priorité)
        const mediaTypes = [
          'wheel', 'logo-svg', 'photo', 'illustration', // Types prioritaires
          'wheel-carbon', 'wheel-steel', 'logo-monochrome', 'icon', 'minicon', // Alternatives
          'controller', 'screenmarquee', 'BoitierConsole3D' // Fallbacks
        ]
        const regionPriority = [currentRegion, 'WOR', 'EU', 'US', 'JP', 'FR', 'ASI']
        
        const url = await getBestCachedMediaUrl('console', consoleData.id, mediaTypes, regionPriority)
        if (url) {
          setImageUrl(url)
        }
      } catch (error) {
        console.error(`Erreur chargement image console ${consoleData.slug}:`, error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadImage()
  }, [consoleData.id, consoleData.slug, currentRegion])
  
  // Utilisation directe des données de base pour optimiser les performances
  const displayName = consoleData.name
  const displayYear = consoleData.releaseYear

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
              alt={displayName}
              width={400}
              height={300}
              className={`h-full w-full object-contain transition-transform duration-200 group-hover:scale-105 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
            />
          </div>
          
          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-medium text-gray-900 dark:text-white line-clamp-2 leading-tight">
                {displayName}
              </h3>
              {displayYear && (
                <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  {displayYear}
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