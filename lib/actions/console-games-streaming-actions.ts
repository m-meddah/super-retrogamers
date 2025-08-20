'use server'

import { prisma } from '@/lib/prisma'
import { GameWithConsole } from '@/lib/data-prisma'
import { getCachedMediaUrl } from '@/lib/media-url-cache'

export interface ConsoleGamesFilters {
  consoleSlug: string
  genreName?: string
  searchQuery?: string
  sortBy?: 'title' | 'rating' | 'releaseYear' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

const MAX_GAMES_PER_REQUEST = 50

/**
 * Charge les jeux d'une console avec pagination et streaming
 */
export async function loadConsoleGamesStream(
  offset: number = 0,
  limit: number = 20,
  filters: ConsoleGamesFilters
): Promise<GameWithConsole[]> {
  try {
    // Limite de sécurité
    const safeLimit = Math.min(limit, MAX_GAMES_PER_REQUEST)
    
    // Construction des conditions de filtrage
    const whereConditions: Record<string, unknown> = {
      console: {
        slug: filters.consoleSlug
      }
    }
    
    if (filters.genreName && filters.genreName !== 'all') {
      whereConditions.genre = {
        name: filters.genreName
      }
    }
    
    if (filters.searchQuery) {
      whereConditions.OR = [
        {
          title: {
            contains: filters.searchQuery,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: filters.searchQuery,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Construction du tri
    const orderBy: Record<string, unknown> = {}
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'asc'
    } else {
      // Tri par défaut : alphabétique
      orderBy.title = 'asc'
    }

    // Requête optimisée avec includes minimaux pour performance
    const games = await prisma.game.findMany({
      where: whereConditions,
      include: {
        console: {
          select: {
            name: true,
            slug: true,
            id: true
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
        }
      },
      orderBy,
      skip: offset,
      take: safeLimit
    })

    // Cast simple vers le type attendu
    const gamesWithMedia = games as unknown as GameWithConsole[]

    // Préchargement des URLs pour optimiser l'affichage
    try {
      // Précharger les images pour les premiers jeux de façon asynchrone
      const mediaPromises = gamesWithMedia.slice(0, 10).map(async (game) => {
        try {
          await getCachedMediaUrl('game', game.id, 'box-2D', 'FR')
        } catch {
          // Ignore les erreurs individuelles
        }
      })
      
      // Ne pas attendre pour ne pas ralentir la réponse
      Promise.all(mediaPromises)
    } catch {
      // Ignore les erreurs de préchargement
    }

    return gamesWithMedia
  } catch (error) {
    console.error('Erreur lors du chargement des jeux de console:', error)
    return []
  }
}

/**
 * Compte le nombre total de jeux d'une console avec filtres
 */
export async function countConsoleGamesStream(filters: ConsoleGamesFilters): Promise<number> {
  try {
    const whereConditions: Record<string, unknown> = {
      console: {
        slug: filters.consoleSlug
      }
    }
    
    if (filters.genreName && filters.genreName !== 'all') {
      whereConditions.genre = {
        name: filters.genreName
      }
    }
    
    if (filters.searchQuery) {
      whereConditions.OR = [
        {
          title: {
            contains: filters.searchQuery,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: filters.searchQuery,
            mode: 'insensitive'
          }
        }
      ]
    }

    return await prisma.game.count({
      where: whereConditions
    })
  } catch (error) {
    console.error('Erreur lors du comptage des jeux de console:', error)
    return 0
  }
}

/**
 * Obtient les statistiques pour une console
 */
export async function getConsoleStreamingStats(consoleSlug: string): Promise<{
  totalGames: number
  totalGenres: number
  averageRating: number
  topGenres: Array<{name: string, count: number}>
}> {
  try {
    const [totalGames, genreStats, avgRating] = await Promise.all([
      prisma.game.count({
        where: {
          console: {
            slug: consoleSlug
          }
        }
      }),
      prisma.game.groupBy({
        by: ['genreId'],
        where: {
          console: {
            slug: consoleSlug
          },
          genreId: {
            not: null
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 5
      }),
      prisma.game.aggregate({
        where: {
          console: {
            slug: consoleSlug
          },
          rating: {
            not: null
          }
        },
        _avg: {
          rating: true
        }
      })
    ])

    // Récupérer les noms des genres
    const genreIds = genreStats.map(stat => stat.genreId).filter(Boolean).map(id => String(id))
    const genres = await prisma.genre.findMany({
      where: {
        id: {
          in: genreIds
        }
      },
      select: {
        id: true,
        name: true
      }
    })

    const topGenres = genreStats.map(stat => {
      const genre = genres.find(g => g.id === String(stat.genreId))
      return {
        name: genre?.name || 'Genre inconnu',
        count: stat._count.id
      }
    })

    return {
      totalGames,
      totalGenres: genreStats.length,
      averageRating: Number(avgRating._avg.rating?.toFixed(1)) || 0,
      topGenres
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des stats de console:', error)
    return {
      totalGames: 0,
      totalGenres: 0,
      averageRating: 0,
      topGenres: []
    }
  }
}

/**
 * Interface pour les résultats transformés
 */
export interface GameWithConsoleAndMedia extends GameWithConsole {
  mediaUrl?: string
  wheelUrl?: string
}

/**
 * Précharge les médias pour une liste de jeux de console
 */
export async function preloadConsoleGamesMedia(
  consoleSlug: string,
  gameIds: string[]
): Promise<void> {
  try {
    console.log(`🚀 Préchargement des médias pour ${gameIds.length} jeux de ${consoleSlug}`)
    
    // Traitement par petits batches pour éviter la surcharge
    const batchSize = 10
    const mediaTypes = ['box-2D', 'wheel', 'sstitle', 'ss']
    const regions = ['fr', 'eu', 'wor', 'us', 'jp']
    
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
              } catch {
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
    
    console.log(`✅ Préchargement terminé pour la console ${consoleSlug}`)
  } catch (error) {
    console.error('Erreur lors du préchargement des médias:', error)
  }
}