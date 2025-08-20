'use server'

import { prisma } from '@/lib/prisma'
import { getCachedMediaUrl } from '@/lib/media-url-cache'
import type { GameWithConsole } from '@/lib/data-prisma'

/**
 * Stratégie unifiée pour la gestion des médias
 * - Priorité aux URLs externes cachées (économique)
 * - Fallback vers médias locaux existants (compatibilité)
 * - Migration progressive des anciens médias
 */

export type MediaSource = 'cache' | 'local' | 'placeholder'

export interface MediaResult {
  url: string
  source: MediaSource
  mediaType: string
  region: string
}

/**
 * Récupère la meilleure image pour un jeu avec stratégie hybride
 */
export async function getBestGameMedia(
  game: GameWithConsole,
  preferredTypes: string[] = ['box-2D', 'wheel', 'sstitle', 'ss'],
  preferredRegions: string[] = ['FR', 'EU', 'WOR', 'US', 'JP']
): Promise<MediaResult | null> {
  
  // Stratégie 1: Cache d'URLs externes (priorité)
  for (const mediaType of preferredTypes) {
    for (const region of preferredRegions) {
      const cachedUrl = await getCachedMediaUrl('game', game.id, mediaType, region)
      if (cachedUrl) {
        return {
          url: cachedUrl,
          source: 'cache',
          mediaType,
          region
        }
      }
    }
  }

  // Stratégie 2: Médias locaux existants (fallback)
  if (game.medias && game.medias.length > 0) {
    for (const mediaType of preferredTypes) {
      for (const region of preferredRegions) {
        const localMedia = game.medias.find(m => 
          m.mediaType === mediaType && 
          m.region === region && 
          m.localPath
        )
        
        if (localMedia?.localPath) {
          return {
            url: localMedia.localPath,
            source: 'local',
            mediaType,
            region
          }
        }
      }
    }
    
    // Si pas de match exact, prendre le premier média local disponible
    const firstLocalMedia = game.medias.find(m => m.localPath)
    if (firstLocalMedia?.localPath) {
      return {
        url: firstLocalMedia.localPath,
        source: 'local',
        mediaType: firstLocalMedia.mediaType,
        region: firstLocalMedia.region
      }
    }
  }

  // Stratégie 3: Placeholder final
  return {
    url: '/placeholder-game.svg',
    source: 'placeholder',
    mediaType: 'placeholder',
    region: 'none'
  }
}

/**
 * Même stratégie pour les consoles
 */
export async function getBestConsoleMedia(
  consoleId: string,
  preferredTypes: string[] = ['logo', 'wheel', 'ss'],
  preferredRegions: string[] = ['FR', 'EU', 'WOR', 'US', 'JP']
): Promise<MediaResult | null> {
  
  // Stratégie 1: Cache d'URLs externes
  for (const mediaType of preferredTypes) {
    for (const region of preferredRegions) {
      const cachedUrl = await getCachedMediaUrl('console', consoleId, mediaType, region)
      if (cachedUrl) {
        return {
          url: cachedUrl,
          source: 'cache',
          mediaType,
          region
        }
      }
    }
  }

  // Stratégie 2: Médias locaux existants
  const console = await prisma.console.findUnique({
    where: { id: consoleId },
    include: { }
  })

  if (console?.medias && console.medias.length > 0) {
    for (const mediaType of preferredTypes) {
      for (const region of preferredRegions) {
        const localMedia = console.medias.find(m => 
          m.type === mediaType && 
          m.region === region && 
          m.localPath
        )
        
        if (localMedia?.localPath) {
          return {
            url: localMedia.localPath,
            source: 'local',
            mediaType,
            region
          }
        }
      }
    }
  }

  return {
    url: '/placeholder-console.svg',
    source: 'placeholder',
    mediaType: 'placeholder',
    region: 'none'
  }
}

/**
 * Migration progressive: marque les médias locaux comme obsolètes
 */
export async function migrateLocalMediaToCache(
  entityType: 'game' | 'console',
  entityId: string,
  batchSize: number = 10
): Promise<{
  migrated: number
  cached: number
  errors: number
}> {
  let migrated = 0
  let cached = 0
  let errors = 0

  try {
    if (entityType === 'game') {
      const gameMedias = await prisma.gameMedia.findMany({
        where: { 
          gameId: entityId,
          localPath: { not: null }
        },
        take: batchSize
      })

      for (const media of gameMedias) {
        try {
          // Essayer de récupérer l'URL externe pour ce média
          const externalUrl = await getCachedMediaUrl(
            'game', 
            entityId, 
            media.mediaType, 
            media.region
          )

          if (externalUrl) {
            // Marquer le média local comme migré (optionnel)
            await prisma.gameMedia.update({
              where: { id: media.id },
              data: { 
                // Garder localPath pour compatibilité, mais noter la migration
                url: externalUrl 
              }
            })
            cached++
          }
          migrated++
        } catch (error) {
          console.error(`Erreur migration média ${media.id}:`, error)
          errors++
        }
      }
    }
    // TODO: Même logique pour console medias

  } catch (error) {
    console.error('Erreur lors de la migration:', error)
    errors++
  }

  return { migrated, cached, errors }
}

/**
 * Statistiques de l'utilisation des médias
 */
export async function getMediaUsageStats(): Promise<{
  games: {
    totalWithLocalMedia: number
    totalWithCachedUrls: number
    totalWithoutMedia: number
  }
  consoles: {
    totalWithLocalMedia: number
    totalWithCachedUrls: number
    totalWithoutMedia: number
  }
  storage: {
    localMediaSizeEstimate: string
    cacheEntriesCount: number
  }
}> {
  const [
    cacheEntries,
    totalGames,
    totalConsoles
  ] = await Promise.all([
    prisma.mediaUrlCache.count(),
    prisma.game.count(),
    prisma.console.count()
  ])
  
  // Since local media tables are removed, these are always 0
  const gamesWithLocalMedia = 0
  const consolesWithLocalMedia = 0

  const gamesWithCachedUrls = await prisma.mediaUrlCache.count({
    where: { entityType: 'game' }
  })

  const consolesWithCachedUrls = await prisma.mediaUrlCache.count({
    where: { entityType: 'console' }
  })

  return {
    games: {
      totalWithLocalMedia: gamesWithLocalMedia,
      totalWithCachedUrls: gamesWithCachedUrls,
      totalWithoutMedia: totalGames - gamesWithLocalMedia - gamesWithCachedUrls
    },
    consoles: {
      totalWithLocalMedia: consolesWithLocalMedia,
      totalWithCachedUrls: consolesWithCachedUrls,
      totalWithoutMedia: totalConsoles - consolesWithLocalMedia - consolesWithCachedUrls
    },
    storage: {
      localMediaSizeEstimate: `${((gamesWithLocalMedia + consolesWithLocalMedia) * 200 / 1024).toFixed(1)} MB`,
      cacheEntriesCount: cacheEntries
    }
  }
}