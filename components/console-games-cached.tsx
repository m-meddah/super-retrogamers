import Image from 'next/image'
import { Region } from '@prisma/client'
import { getServerPreferredRegion } from '@/lib/server-region-detection'
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

interface ConsoleGamesCachedProps {
  games: GameWithConsole[]
  preferredRegion?: Region
  showConsole?: boolean
}

export default async function ConsoleGamesCached({ 
  games, 
  preferredRegion, 
  showConsole = false 
}: ConsoleGamesCachedProps) {
  // Utiliser la région fournie ou détecter côté serveur
  const region = preferredRegion || await getServerPreferredRegion()
  
  // Récupérer les images directement depuis le cache existant pour tous les jeux
  const gamesWithImages = await Promise.all(
    games.map(async (game) => {
      // Ordre de priorité des régions
      const regionPriority = [region.toLowerCase(), 'wor', 'jp', 'eu', 'us', 'asi']
      
      // Types de médias par ordre de priorité (box-2D en premier)
      const mediaTypePriority = [
        'box-2D', 'box-2D-back', 'box-2D-side', 'wheel-carbon', 
        'wheel-steel', 'screenmarquee', 'support-2D', 'mixrbv2'
      ]
      
      // Chercher la meilleure image en cache (même expirée mais valide)
      let imageUrl = null
      
      for (const mediaType of mediaTypePriority) {
        for (const r of regionPriority) {
          const cached = await prisma.mediaUrlCache.findFirst({
            where: {
              entityType: 'game',
              entityId: game.id,
              mediaType: mediaType,
              region: r,
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
      
      return { ...game, imageUrl }
    })
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {gamesWithImages.map((game) => (
        <div key={game.id} className="group relative">
          <article className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700">
            {/* Image complète sans coupure */}
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800">
              {game.imageUrl ? (
                <Image
                  src={game.imageUrl}
                  alt={game.title}
                  fill
                  className="object-contain transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-600">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-base font-medium text-gray-900 dark:text-white line-clamp-2 leading-tight">
                  <a 
                    href={`/jeux/${game.console?.slug ? `${game.slug}-console-${game.console.slug}` : game.slug}?region=${region}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {game.title}
                  </a>
                  {game.topStaff && (
                    <svg className="inline-block h-3 w-3 ml-1 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                </h3>
                {game.rating && (
                  <div className="flex items-center gap-1 shrink-0">
                    <svg className="h-3 w-3 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
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
        </div>
      ))}
    </div>
  )
}