'use server'

import { prisma } from '@/lib/prisma'
import type { GameWithConsole } from '@/lib/data-prisma'

/**
 * Actions optimisées pour le streaming de données avec rate limiting
 * Évite les appels massifs à Screenscraper en utilisant le cache local
 */

const GAMES_PER_PAGE = 20
const MAX_GAMES_PER_REQUEST = 50

/**
 * Charge les jeux par batch avec streaming optimisé
 */
export async function loadGamesStream(
  offset: number = 0,
  limit: number = GAMES_PER_PAGE,
  filters?: {
    consoleSlug?: string
    genreName?: string
    searchQuery?: string
    sortBy?: 'title' | 'rating' | 'releaseYear' | 'createdAt'
    sortOrder?: 'asc' | 'desc'
  }
): Promise<GameWithConsole[]> {
  try {
    // Limite de sécurité
    const safeLimit = Math.min(limit, MAX_GAMES_PER_REQUEST)
    
    // Construction des conditions de filtrage
    const whereConditions: any = {}
    
    if (filters?.consoleSlug) {
      whereConditions.console = {
        slug: filters.consoleSlug
      }
    }
    
    if (filters?.genreName && filters.genreName !== 'all') {
      whereConditions.genre = {
        name: filters.genreName
      }
    }
    
    if (filters?.searchQuery) {
      const searchTerms = filters.searchQuery.toLowerCase().split(' ')
      whereConditions.OR = [
        {
          title: {
            contains: filters.searchQuery,
            mode: 'insensitive'
          }
        },
        {
          corporationDev: {
            name: {
              contains: filters.searchQuery,
              mode: 'insensitive'
            }
          }
        },
        {
          corporationPub: {
            name: {
              contains: filters.searchQuery,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    // Construction du tri
    const orderBy: any = {}
    if (filters?.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'desc'
    } else {
      // Tri par défaut : top staff puis rating puis titre
      orderBy.topStaff = 'desc'
    }

    // Requête optimisée avec includes minimaux pour performance
    const games = await prisma.game.findMany({
      where: whereConditions,
      include: {
        console: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        genre: {
          select: {
            name: true
          }
        },
        corporationDev: {
          select: {
            name: true
          }
        },
        corporationPub: {
          select: {
            name: true
          }
        },
        // Ne pas inclure les médias ici, on les chargera via le cache
        regionalDates: {
          select: {
            region: true,
            releaseDate: true
          }
        }
      },
      orderBy: [
        orderBy,
        { title: 'asc' } // Tri secondaire par titre
      ],
      skip: offset,
      take: safeLimit
    })

    return games as GameWithConsole[]

  } catch (error) {
    console.error('Erreur lors du chargement des jeux en streaming:', error)
    throw new Error('Impossible de charger les jeux')
  }
}

/**
 * Charge les jeux d'une console avec streaming
 */
export async function loadConsoleGamesStream(
  consoleSlug: string,
  offset: number = 0,
  limit: number = GAMES_PER_PAGE
): Promise<GameWithConsole[]> {
  return loadGamesStream(offset, limit, { consoleSlug })
}

/**
 * Recherche de jeux avec streaming
 */
export async function searchGamesStream(
  searchQuery: string,
  offset: number = 0,
  limit: number = GAMES_PER_PAGE,
  additionalFilters?: {
    consoleSlug?: string
    genreName?: string
  }
): Promise<GameWithConsole[]> {
  return loadGamesStream(offset, limit, {
    searchQuery,
    ...additionalFilters
  })
}

/**
 * Compte le nombre total de jeux pour la pagination
 */
export async function countGamesStream(filters?: {
  consoleSlug?: string
  genreName?: string
  searchQuery?: string
}): Promise<number> {
  try {
    const whereConditions: any = {}
    
    if (filters?.consoleSlug) {
      whereConditions.console = {
        slug: filters.consoleSlug
      }
    }
    
    if (filters?.genreName && filters.genreName !== 'all') {
      whereConditions.genre = {
        name: filters.genreName
      }
    }
    
    if (filters?.searchQuery) {
      whereConditions.OR = [
        {
          title: {
            contains: filters.searchQuery,
            mode: 'insensitive'
          }
        },
        {
          corporationDev: {
            name: {
              contains: filters.searchQuery,
              mode: 'insensitive'
            }
          }
        },
        {
          corporationPub: {
            name: {
              contains: filters.searchQuery,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    return await prisma.game.count({
      where: whereConditions
    })

  } catch (error) {
    console.error('Erreur lors du comptage des jeux:', error)
    return 0
  }
}

/**
 * Précharge les URLs d'images pour un batch de jeux
 * Utilisé en arrière-plan pour optimiser les performances
 */
export async function preloadGameImages(
  gameIds: string[],
  mediaTypes: string[] = ['box-2D', 'wheel'],
  regions: string[] = ['FR', 'EU', 'WOR']
): Promise<void> {
  try {
    // Import dynamique pour éviter les dépendances circulaires
    const { getCachedMediaUrl } = await import('@/lib/media-url-cache')
    
    // Limite le nombre de jeux traités en parallèle
    const batchSize = 5
    
    for (let i = 0; i < gameIds.length; i += batchSize) {
      const batch = gameIds.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(async (gameId) => {
          for (const mediaType of mediaTypes) {
            for (const region of regions) {
              try {
                await getCachedMediaUrl('game', gameId, mediaType, region)
                // Rate limiting léger entre les appels
                await new Promise(resolve => setTimeout(resolve, 100))
              } catch (error) {
                // Ignore les erreurs individuelles
              }
            }
          }
        })
      )
      
      // Pause entre les batches pour éviter la surcharge
      if (i + batchSize < gameIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  } catch (error) {
    console.error('Erreur lors du préchargement des images:', error)
  }
}

/**
 * Statistiques de performance du streaming
 */
export async function getStreamingStats(): Promise<{
  totalGames: number
  totalConsoles: number
  averageGamesPerConsole: number
  cacheStats: any
}> {
  try {
    const [totalGames, totalConsoles, cacheStats] = await Promise.all([
      prisma.game.count(),
      prisma.console.count(),
      prisma.mediaUrlCache.groupBy({
        by: ['entityType'],
        _count: {
          id: true
        }
      })
    ])

    return {
      totalGames,
      totalConsoles,
      averageGamesPerConsole: totalConsoles > 0 ? Math.round(totalGames / totalConsoles) : 0,
      cacheStats: cacheStats.reduce((acc, item) => {
        acc[item.entityType] = item._count.id
        return acc
      }, {} as Record<string, number>)
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return {
      totalGames: 0,
      totalConsoles: 0,
      averageGamesPerConsole: 0,
      cacheStats: {}
    }
  }
}