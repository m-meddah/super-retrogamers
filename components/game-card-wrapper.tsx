'use client'

import { Suspense } from 'react'
import RegionalLink from "@/components/regional-link"
import Image from "next/image"
import { Star, Award, Users } from "lucide-react"
import type { Game } from "@prisma/client"
import { selectBestGameImage } from "@/lib/regional-preferences"
import { useRegionalGameTitle, useRegionalReleaseDate } from "@/lib/hooks/use-regional-names"

interface GameWithConsole extends Game {
  console?: {
    name: string
    slug: string
  }
  medias?: Array<{
    mediaType: string
    region: string
    localPath: string | null
  }>
}

// Type pour les résultats de recherche
interface SearchGameResult {
  id: string
  slug: string
  title: string
  rating: number | null
  releaseYear: number | null
  genre: string | null
  playerCount: string | null
  topStaff: boolean
  console: {
    name: string
    slug: string
  } | null
  medias: Array<{
    mediaType: string
    region: string
    localPath: string | null
  }>
}

interface GameCardWrapperProps {
  game: GameWithConsole | SearchGameResult
  showConsole?: boolean
  preferredRegion?: string
}


export default function GameCardWrapper({ game, showConsole = true, preferredRegion = 'fr' }: GameCardWrapperProps) {
  // Use regional hooks for title and release date (only for non-Screenscraper results)
  const isScreenscraperResult = game.slug.startsWith('screenscraper-')
  const { title: regionalTitle, loading: titleLoading } = useRegionalGameTitle(isScreenscraperResult ? '' : game.id)
  const { releaseDate: regionalReleaseDate, loading: dateLoading } = useRegionalReleaseDate(isScreenscraperResult ? '' : game.id, 'game')

  // Transformer le jeu en format RegionalGameData pour la fonction selectBestGameImage
  const regionalGame = {
    id: game.id,
    title: game.title,
    slug: game.slug,
    consoleId: game.console?.slug || '',
    releaseYear: game.releaseYear,
    description: 'description' in game ? game.description || null : null,
    image: null, // Image column removed, using regional media only
    medias: (game.medias || []).map(media => ({
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
  
  const imageUrl = selectBestGameImage(regionalGame, preferredRegion) || "/placeholder.svg"
  
  // Use regional data if available, otherwise fallback to default
  const displayTitle = isScreenscraperResult ? game.title : (regionalTitle || game.title)
  const displayYear = isScreenscraperResult ? game.releaseYear : (regionalReleaseDate?.getFullYear() || game.releaseYear)
  
  // Générer le slug composé pour les liens
  const gameSlug = game.console?.slug ? 
    `${game.slug}-console-${game.console.slug}` : 
    game.slug
  
  const cardContent = (
    <article className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700">
      {/* Image */}
      <div className="aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800">
        <Image 
          src={imageUrl} 
          alt={displayTitle}
          width={300}
          height={400}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className={`text-base font-medium text-gray-900 dark:text-white line-clamp-2 leading-tight transition-all duration-200 ${!isScreenscraperResult && titleLoading ? 'opacity-70' : 'opacity-100'}`}>
            {displayTitle}
            {game.topStaff && (
              <Award className="inline-block h-3 w-3 ml-1 text-amber-500" />
            )}
          </h3>
          {game.rating && (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {game.rating}/20
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-2">
          {game.genre && <span>{game.genre}</span>}
          {game.genre && displayYear && <span>•</span>}
          {displayYear && (
            <span>{!isScreenscraperResult && dateLoading ? '...' : displayYear}</span>
          )}
          {(game.genre || displayYear) && game.playerCount && <span>•</span>}
          {game.playerCount && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {game.playerCount}
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-1 mb-2">
          {showConsole && game.console?.name && (
            <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {game.console.name}
            </span>
          )}
          
          {/* Badge Screenscraper */}
          {isScreenscraperResult && (
            <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
              Screenscraper
            </span>
          )}
          
          {/* Game badges */}
        </div>
        
        {'description' in game && game.description && (
          <p className="text-sm text-gray-500 dark:text-gray-500 line-clamp-2 leading-relaxed">
            {game.description}
          </p>
        )}
      </div>
    </article>
  )
  
  return (
    <Suspense fallback={
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
        </div>
      </div>
    }>
      {/* Pour les résultats Screenscraper, désactiver le lien car il n'y a pas de page de détail */}
      {isScreenscraperResult ? (
        <div className="group block cursor-default">
          {cardContent}
        </div>
      ) : (
        <RegionalLink href={`/jeux/${gameSlug}`} className="group block">
          {cardContent}
        </RegionalLink>
      )}
    </Suspense>
  )
}