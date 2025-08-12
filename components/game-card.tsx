import Link from "next/link"
import Image from "next/image"
import { Star, Award, Users } from "lucide-react"
import type { Game } from "@prisma/client"
import { getRegionPriorityLowercase } from "@/lib/regional-preferences"

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
  image: string | null
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

interface GameCardProps {
  game: GameWithConsole | SearchGameResult
  showConsole?: boolean
  preferredRegion?: string
}

// Function to get the best available image for the game card
function getBestGameImage(game: GameWithConsole | SearchGameResult, preferredRegion: string = 'fr'): string {
  if (!game.medias || game.medias.length === 0) {
    return game.image || "/placeholder.svg"
  }
  
  // Priority order for game card images
  const priorityTypes = ['box-2D', 'box-3D', 'wheel', 'sstitle', 'ss']
  // Use centralized regional preferences (with 'ss' last)
  const priorityRegions = getRegionPriorityLowercase(preferredRegion)
  
  // Try each priority type
  for (const type of priorityTypes) {
    // Try each priority region for this type
    for (const region of priorityRegions) {
      const media = game.medias.find(m => 
        m.mediaType === type && 
        m.region.toLowerCase() === region && 
        m.localPath
      )
      if (media?.localPath) {
        return media.localPath
      }
    }
    
    // If no priority region found, take any region for this type
    const media = game.medias.find(m => m.mediaType === type && m.localPath)
    if (media?.localPath) {
      return media.localPath
    }
  }
  
  // Fallback to first available media or placeholder
  const firstMedia = game.medias.find(m => m.localPath)
  return firstMedia?.localPath || game.image || "/placeholder.svg"
}

export default function GameCard({ game, showConsole = true, preferredRegion = 'fr' }: GameCardProps) {
  const imageUrl = getBestGameImage(game, preferredRegion)
  const isScreenscraperResult = game.slug.startsWith('screenscraper-')
  
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
          alt={game.title}
          width={300}
          height={400}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base font-medium text-gray-900 dark:text-white line-clamp-2 leading-tight">
            {game.title}
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
          {game.genre && game.releaseYear && <span>•</span>}
          {game.releaseYear && <span>{game.releaseYear}</span>}
          {(game.genre || game.releaseYear) && game.playerCount && <span>•</span>}
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
  
  // Pour les résultats Screenscraper, désactiver le lien car il n'y a pas de page de détail
  if (isScreenscraperResult) {
    return (
      <div className="group block cursor-default">
        {cardContent}
      </div>
    )
  }
  
  return (
    <Link href={`/jeux/${gameSlug}`} className="group block">
      {cardContent}
    </Link>
  )
}
