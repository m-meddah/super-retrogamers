import { prisma } from "@/lib/prisma"
import type { Console, Game, ConsoleMedia } from "@prisma/client"

// Types pour les relations complètes
export type ConsoleWithGames = Console & {
  games: Game[]
  _count: {
    games: number
  }
}

export type ConsoleWithMedias = Console & {
  medias: ConsoleMedia[]
}

export type GameWithConsole = Game & {
  console: Console
}

// Fonctions pour récupérer les consoles
export async function getAllConsoles(): Promise<Console[]> {
  return await prisma.console.findMany({
    orderBy: {
      releaseYear: 'asc'
    }
  })
}

export async function getConsoleBySlug(slug: string): Promise<Console | null> {
  return await prisma.console.findUnique({
    where: { slug }
  })
}

export async function getConsoleWithMediasBySlug(slug: string): Promise<ConsoleWithMedias | null> {
  return await prisma.console.findUnique({
    where: { slug },
    include: {
      medias: true
    }
  })
}

export async function getAllConsolesWithMedias(): Promise<ConsoleWithMedias[]> {
  return await prisma.console.findMany({
    include: {
      medias: true
    },
    orderBy: {
      releaseYear: 'asc'
    }
  })
}

export async function getConsoleWithGames(slug: string): Promise<ConsoleWithGames | null> {
  return await prisma.console.findUnique({
    where: { slug },
    include: {
      games: {
        orderBy: {
          title: 'asc'
        }
      },
      _count: {
        select: {
          games: true
        }
      }
    }
  })
}

// Fonctions pour récupérer les jeux
export async function getAllGames(): Promise<Game[]> {
  return await prisma.game.findMany({
    orderBy: {
      title: 'asc'
    }
  })
}

export async function getGameBySlug(slug: string): Promise<GameWithConsole | null> {
  return await prisma.game.findUnique({
    where: { slug },
    include: {
      console: true
    }
  })
}

export async function getGamesByConsole(consoleSlug: string): Promise<Game[]> {
  return await prisma.game.findMany({
    where: {
      console: {
        slug: consoleSlug
      }
    },
    orderBy: {
      title: 'asc'
    }
  })
}

export async function getGamesByConsoleWithConsoleInfo(consoleSlug: string): Promise<GameWithConsole[]> {
  return await prisma.game.findMany({
    where: {
      console: {
        slug: consoleSlug
      }
    },
    include: {
      console: true
    },
    orderBy: {
      title: 'asc'
    }
  })
}

export async function getGamesByConsoleId(consoleId: string): Promise<Game[]> {
  return await prisma.game.findMany({
    where: {
      consoleId
    },
    orderBy: {
      title: 'asc'
    }
  })
}


// Fonctions pour les statistiques
export async function getConsoleCount(): Promise<number> {
  return await prisma.console.count()
}

export async function getGameCount(): Promise<number> {
  return await prisma.game.count()
}

export async function getStatsForHomepage(): Promise<{
  consoleCount: number
  gameCount: number
  oldestConsoleYear: number | null
}> {
  const [consoleCount, gameCount, oldestConsole] = await Promise.all([
    prisma.console.count(),
    prisma.game.count(),
    prisma.console.findFirst({
      orderBy: {
        releaseYear: 'asc'
      },
      select: {
        releaseYear: true
      }
    })
  ])

  return {
    consoleCount,
    gameCount,
    oldestConsoleYear: oldestConsole?.releaseYear || null
  }
}

// Fonctions pour les jeux populaires/récents
export async function getFeaturedConsoles(limit: number = 3): Promise<ConsoleWithGames[]> {
  return await prisma.console.findMany({
    take: limit,
    include: {
      games: {
        take: 3,
        orderBy: {
          rating: 'desc'
        }
      },
      _count: {
        select: {
          games: true
        }
      }
    },
    orderBy: {
      releaseYear: 'asc'
    }
  })
}

// Fonction pour récupérer des consoles spécifiques pour la homepage
export async function getHomepageFeaturedConsoles(): Promise<Console[]> {
  const featuredConsoles: Console[] = []
  
  // Rechercher les consoles spécifiques par critères précis
  const consoleQueries = await Promise.all([
    // Neo Geo - par slug et screenscrapeId
    prisma.console.findFirst({
      where: {
        OR: [
          { slug: 'neo-geo' },
          { screenscrapeId: 142 },
          { name: { contains: 'Neo Geo', mode: 'insensitive' } },
          { name: { contains: 'NeoGeo', mode: 'insensitive' } }
        ]
      }
    }),
    
    // Super Nintendo
    prisma.console.findFirst({
      where: {
        OR: [
          { name: { contains: 'Super Nintendo', mode: 'insensitive' } },
          { name: { contains: 'SNES', mode: 'insensitive' } },
          { slug: { contains: 'snes', mode: 'insensitive' } },
          { slug: { contains: 'super-nintendo', mode: 'insensitive' } }
        ]
      }
    }),
    
    // PlayStation (original, pas la 2)
    prisma.console.findFirst({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: 'PlayStation', mode: 'insensitive' } },
              { name: { contains: 'PSX', mode: 'insensitive' } },
              { slug: { contains: 'playstation', mode: 'insensitive' } }
            ]
          },
          {
            NOT: {
              name: { contains: '2', mode: 'insensitive' }
            }
          }
        ]
      }
    })
  ])
  
  // Ajouter les consoles trouvées dans l'ordre souhaité
  consoleQueries.forEach(console => {
    if (console) {
      featuredConsoles.push(console)
    }
  })
  
  return featuredConsoles
}

// Fonctions utilitaires pour les médias
export function getConsoleMediaByType(console: ConsoleWithMedias, mediaType: string, region?: string): ConsoleMedia | null {
  if (!console.medias) return null
  
  return console.medias.find(media => {
    const typeMatch = media.type === mediaType
    const regionMatch = region ? media.region === region : true
    return typeMatch && regionMatch
  }) || null
}

export function getConsoleMainImage(console: ConsoleWithMedias): string | null {
  // Priorité pour l'image principale : logo-svg > wheel > photo > illustration
  const priorityOrder = ['logo-svg', 'wheel', 'photo', 'illustration']
  
  for (const type of priorityOrder) {
    const media = getConsoleMediaByType(console, type)
    if (media) {
      return media.localPath
    }
  }
  
  // Fallback sur l'image du champ image si pas de médias
  return console.image
}

export function getConsoleMediasByRegion(console: ConsoleWithMedias, region: string): ConsoleMedia[] {
  if (!console.medias) return []
  
  return console.medias.filter(media => media.region === region)
}

export function getAvailableRegions(console: ConsoleWithMedias): string[] {
  if (!console.medias) return []
  
  const regions = console.medias.map(media => media.region)
  return Array.from(new Set(regions)).sort()
}

export async function getTopRatedGames(limit: number = 6): Promise<GameWithConsole[]> {
  return await prisma.game.findMany({
    take: limit,
    where: {
      rating: {
        not: null
      }
    },
    include: {
      console: true
    },
    orderBy: {
      rating: 'desc'
    }
  })
}

export async function getRecentlyAddedGames(limit: number = 6): Promise<GameWithConsole[]> {
  return await prisma.game.findMany({
    take: limit,
    include: {
      console: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

// Fonctions utilitaires pour la compatibilité avec l'ancien code
export async function getConsolePopularGames(consoleSlug: string): Promise<string[]> {
  const games = await prisma.game.findMany({
    where: {
      console: {
        slug: consoleSlug
      }
    },
    orderBy: {
      rating: 'desc'
    },
    take: 4,
    select: {
      title: true
    }
  })

  return games.map(game => game.title)
}

// ================================
// ADMIN DASHBOARD KPI FUNCTIONS
// ================================

export interface AdminDashboardStats {
  users: {
    total: number
    activeThisMonth: number
    newThisWeek: number
    topCollectors: Array<{
      id: string
      name: string | null
      email: string | null
      consoleCount: number
      gameCount: number
    }>
  }
  content: {
    totalConsoles: number
    totalGames: number
    consolesAddedThisWeek: number
    gamesAddedThisWeek: number
    averageGamesPerConsole: number
    consolesWithoutGames: number
  }
  collections: {
    totalUserConsoles: number
    totalUserGames: number
    totalCollectionValue: number
    averageCollectionValue: number
    mostCollectedConsole: string | null
    mostCollectedGame: string | null
  }
  activity: {
    totalReviews: number
    averageRating: number
    reviewsThisWeek: number
    wishlistItems: number
  }
  systemHealth: {
    databaseSize: number
    mediaFilesCount: number
    lastScrapingDate: Date | null
    errorLogs: number
  }
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Statistiques utilisateurs
  const [totalUsers, activeUsersThisMonth, newUsersThisWeek] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        updatedAt: {
          gte: oneMonthAgo
        }
      }
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: oneWeekAgo
        }
      }
    })
  ])

  // Top collectors
  const topCollectors = await prisma.user.findMany({
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: {
          consoleCollection: true,
          gameCollection: true
        }
      }
    },
    orderBy: [
      {
        consoleCollection: {
          _count: 'desc'
        }
      },
      {
        gameCollection: {
          _count: 'desc'
        }
      }
    ]
  }).then(users => 
    users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      consoleCount: user._count.consoleCollection,
      gameCount: user._count.gameCollection
    }))
  )

  // Statistiques de contenu
  const [totalConsoles, totalGames, consolesAddedThisWeek, gamesAddedThisWeek] = await Promise.all([
    prisma.console.count(),
    prisma.game.count(),
    prisma.console.count({
      where: {
        createdAt: {
          gte: oneWeekAgo
        }
      }
    }),
    prisma.game.count({
      where: {
        createdAt: {
          gte: oneWeekAgo
        }
      }
    })
  ])

  const averageGamesPerConsole = totalConsoles > 0 ? Math.round(totalGames / totalConsoles * 100) / 100 : 0

  const consolesWithoutGames = await prisma.console.count({
    where: {
      games: {
        none: {}
      }
    }
  })

  // Statistiques de collections
  const [totalUserConsoles, totalUserGames, collectionStats] = await Promise.all([
    prisma.userConsoleCollection.count(),
    prisma.userGameCollection.count(),
    prisma.userConsoleCollection.aggregate({
      _sum: {
        currentValue: true
      },
      _avg: {
        currentValue: true
      }
    })
  ])

  // Console et jeu les plus collectionnés
  const [mostCollectedConsole, mostCollectedGame] = await Promise.all([
    prisma.userConsoleCollection.groupBy({
      by: ['consoleId'],
      _count: {
        consoleId: true
      },
      orderBy: {
        _count: {
          consoleId: 'desc'
        }
      },
      take: 1
    }).then(async (result) => {
      if (result.length === 0) return null
      const consoleId = result[0].consoleId
      if (!consoleId) return null
      const console = await prisma.console.findUnique({
        where: { id: consoleId },
        select: { name: true }
      })
      return console?.name || null
    }),
    prisma.userGameCollection.groupBy({
      by: ['gameId'],
      _count: {
        gameId: true
      },
      orderBy: {
        _count: {
          gameId: 'desc'
        }
      },
      take: 1
    }).then(async (result) => {
      if (result.length === 0) return null
      const gameId = result[0].gameId
      if (!gameId) return null
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: { title: true }
      })
      return game?.title || null
    })
  ])

  // Statistiques d'activité
  const [totalReviews, averageRatingResult, reviewsThisWeek, wishlistItems] = await Promise.all([
    prisma.gameReview.count(),
    prisma.gameReview.aggregate({
      _avg: {
        rating: true
      }
    }),
    prisma.gameReview.count({
      where: {
        createdAt: {
          gte: oneWeekAgo
        }
      }
    }),
    prisma.userWishlist.count()
  ])

  // Statistiques système
  const [mediaFilesCount, lastScrapingConsole] = await Promise.all([
    prisma.consoleMedia.count(),
    prisma.console.findFirst({
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        updatedAt: true
      },
      where: {
        screenscrapeId: {
          not: null
        }
      }
    })
  ])

  return {
    users: {
      total: totalUsers,
      activeThisMonth: activeUsersThisMonth,
      newThisWeek: newUsersThisWeek,
      topCollectors
    },
    content: {
      totalConsoles,
      totalGames,
      consolesAddedThisWeek,
      gamesAddedThisWeek,
      averageGamesPerConsole,
      consolesWithoutGames
    },
    collections: {
      totalUserConsoles,
      totalUserGames,
      totalCollectionValue: collectionStats._sum.currentValue || 0,
      averageCollectionValue: collectionStats._avg.currentValue || 0,
      mostCollectedConsole,
      mostCollectedGame
    },
    activity: {
      totalReviews,
      averageRating: averageRatingResult._avg.rating || 0,
      reviewsThisWeek,
      wishlistItems
    },
    systemHealth: {
      databaseSize: totalUsers + totalConsoles + totalGames + totalUserConsoles + totalUserGames,
      mediaFilesCount,
      lastScrapingDate: lastScrapingConsole?.updatedAt || null,
      errorLogs: 0 // À implémenter avec un système de logs
    }
  }
}

export async function getRecentActivity() {
  const [recentUsers, recentConsoles, recentGames, recentReviews] = await Promise.all([
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    }),
    prisma.console.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        manufacturer: true,
        createdAt: true
      }
    }),
    prisma.game.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        console: {
          select: {
            name: true
          }
        },
        createdAt: true
      }
    }),
    prisma.gameReview.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        user: {
          select: {
            name: true
          }
        },
        game: {
          select: {
            title: true
          }
        },
        createdAt: true
      }
    })
  ])

  return {
    recentUsers,
    recentConsoles,
    recentGames,
    recentReviews
  }
}

export async function getContentManagementData() {
  const [consolesWithDetails, gamesWithDetails] = await Promise.all([
    prisma.console.findMany({
      take: 100,
      include: {
        _count: {
          select: {
            games: true,
            userCollections: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.game.findMany({
      take: 100,
      include: {
        console: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            userCollections: true,
            reviews: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ])

  return {
    consoles: consolesWithDetails,
    games: gamesWithDetails
  }
}

export async function getUserManagementData() {
  const users = await prisma.user.findMany({
    take: 100,
    include: {
      _count: {
        select: {
          consoleCollection: true,
          gameCollection: true,
          gameReviews: true,
          wishlist: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return users
}