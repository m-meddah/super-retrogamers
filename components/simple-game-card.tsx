import { Region } from '@prisma/client'
import Image from 'next/image'
import { Star, Award, Calendar } from 'lucide-react'
import RegionalLink from '@/components/regional-link'
import { prisma } from '@/lib/prisma'

interface GameWithConsole {
  id: string
  title: string
  slug: string
  rating: number | null
  releaseYear: number | null
  topStaff?: boolean
  console?: {
    name: string
    slug: string
  } | null
  genre?: {
    name: string
  } | null
}

interface SimpleGameCardProps {
  game: GameWithConsole
  preferredRegion: Region
  showConsole?: boolean
}

export default async function SimpleGameCard({ 
  game, 
  preferredRegion, 
  showConsole = true 
}: SimpleGameCardProps) {
  // Ordre de priorité des régions (basé sur la région préférée)
  const regionPriority = [preferredRegion.toLowerCase(), 'wor', 'jp', 'eu', 'us', 'asi']
  
  // Types de médias par ordre de priorité (box-2D en premier)
  const mediaTypePriority = [
    'box-2D', 'box-2D-back', 'box-2D-side', 'wheel-carbon', 
    'wheel-steel', 'screenmarquee', 'support-2D', 'mixrbv2'
  ]
  
  // Chercher la meilleure image en cache (seulement les valides avec URLs)
  let imageUrl = null
  
  for (const mediaType of mediaTypePriority) {
    for (const region of regionPriority) {
      const cached = await prisma.mediaUrlCache.findFirst({
        where: {
          entityType: 'game',
          entityId: game.id,
          mediaType: mediaType,
          region: region,
          isValid: true,
          url: { not: '' }
          // Pas de condition expiresAt pour utiliser les images expirées
        }
      })
      
      if (cached) {
        imageUrl = cached.url
        break
      }
    }
    
    if (imageUrl) break
  }

  // Générer le slug composé pour les liens
  const gameSlug = game.console?.slug ? 
    `${game.slug}-console-${game.console.slug}` : 
    game.slug

  return (
    <RegionalLink href={`/games/${gameSlug}`} className="group block">
      <article className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700">
        {/* Image complète sans coupure */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={game.title}
              fill
              className="object-contain transition-transform duration-200 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-600">
              <Calendar className="h-8 w-8" />
            </div>
          )}
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
            {game.genre?.name && <span>{game.genre.name}</span>}
            {game.genre?.name && game.releaseYear && <span>•</span>}
            {game.releaseYear && <span>{game.releaseYear}</span>}
          </div>
          
          {showConsole && game.console?.name && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {game.console.name}
              </span>
            </div>
          )}
        </div>
      </article>
    </RegionalLink>
  )
}