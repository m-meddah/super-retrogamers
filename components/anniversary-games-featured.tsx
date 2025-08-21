import { Region } from '@prisma/client'
import { getAnniversaryGames } from '@/lib/actions/anniversary-actions'
import { getServerPreferredRegion } from '@/lib/server-region-detection'
import { Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import RegionalLink from '@/components/regional-link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'

interface AnniversaryGamesFeaturedProps {
  preferredRegion?: Region
}

export default async function AnniversaryGamesFeatured({ 
  preferredRegion 
}: AnniversaryGamesFeaturedProps = {}) {
  // Utiliser la région fournie ou détecter côté serveur
  const region = preferredRegion || await getServerPreferredRegion()
  
  // Récupérer les jeux anniversaire
  const games = await getAnniversaryGames(region)
  
  // Récupérer les images directement depuis le cache existant
  const gamesWithImages = await Promise.all(
    games.map(async (game) => {
      // Ordre de priorité des régions
      const regionPriority = [region.toLowerCase(), 'wor', 'jp', 'eu', 'us', 'asi']
      
      // Types de médias par ordre de priorité (box-2D en premier comme demandé)
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

  // Si pas de jeux anniversaire, ne pas afficher la section
  if (gamesWithImages.length === 0) {
    return null
  }

  // Prendre maximum 8 jeux pour la grille
  const featuredGames = gamesWithImages.slice(0, 8)

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header simple */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Anniversaires du jour
          </h2>
          
          <p className="mx-auto mb-4 max-w-3xl text-lg text-gray-600 dark:text-gray-300">
            {gamesWithImages.length === 1 
              ? 'Un jeu légendaire fête son anniversaire aujourd\'hui !' 
              : `${gamesWithImages.length} jeux légendaires fêtent leur anniversaire aujourd'hui !`
            }
          </p>
          
          <div className="mx-auto flex max-w-lg items-center justify-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>

        {/* Games Grid */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {featuredGames.map((game) => {
            // Générer le slug composé pour les liens
            const gameSlug = game.console?.slug ? 
              `${game.slug}-console-${game.console.slug}` : 
              game.slug

            return (
              <div key={game.id} className="group relative">
                {/* Badge anniversaire simple */}
                <div className="absolute -top-2 -right-2 z-10 rounded-md bg-gray-900/90 px-2 py-1 text-xs font-medium text-white shadow-sm">
                  {game.anniversary}
                </div>
                
                {/* Game Card simple sans appels API */}
                <RegionalLink 
                  href={`/jeux/${gameSlug}`} 
                  className="group block"
                >
                  <article className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700">
                    {/* Image */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {game.imageUrl ? (
                        <Image
                          src={game.imageUrl}
                          alt={game.title}
                          fill
                          className="object-cover transition-transform duration-200 group-hover:scale-105"
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
                      <h3 className="mb-2 text-base font-medium text-gray-900 dark:text-white line-clamp-2 leading-tight">
                        {game.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        {game.console?.name && (
                          <span className="inline-block rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {game.console.name}
                          </span>
                        )}
                        {game.releaseYear && (
                          <span>{game.releaseYear}</span>
                        )}
                      </div>
                    </div>
                  </article>
                </RegionalLink>
              </div>
            )
          })}
        </div>

        {/* Bouton voir plus si + de 8 jeux */}
        {gamesWithImages.length > 8 && (
          <div className="text-center">
            <Link
              href={`/recherche?anniversaire=today`}
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-base font-medium text-white transition-all hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Voir les {gamesWithImages.length - 8} autres anniversaires
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}