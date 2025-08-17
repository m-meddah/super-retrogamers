import { prisma } from "@/lib/prisma"
import type { Console, Game, ConsoleMedia, GameMedia, GameGenre } from "@prisma/client"

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
  medias?: GameMedia[]
  genres?: GameGenre[]
}

// Fonctions pour récupérer les consoles
export async function getAllConsoles(): Promise<ConsoleWithMedias[]> {
  return await prisma.console.findMany({
    include: {
      medias: true
    },
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
  // Support des anciens slugs simples et nouveaux slugs composés
  if (slug.includes('-console-')) {
    // Nouveau format: [game-slug]-console-[console-slug]
    const parts = slug.split('-console-')
    if (parts.length === 2) {
      const gameSlug = parts[0]
      const consoleSlug = parts[1]
      
      return await prisma.game.findFirst({
        where: {
          slug: gameSlug,
          console: {
            slug: consoleSlug
          }
        },
        include: {
          console: true,
          medias: {
            orderBy: [
              { mediaType: 'asc' },
              { region: 'asc' }
            ]
          },
          genres: {
            orderBy: { isPrimary: 'desc' }
          }
        }
      })
    }
  }
  
  // Format ancien ou simple slug
  return await prisma.game.findFirst({
    where: { slug },
    include: {
      console: true,
      medias: {
        orderBy: [
          { mediaType: 'asc' },
          { region: 'asc' }
        ]
      },
      genres: {
        orderBy: { isPrimary: 'desc' }
      }
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
      console: true,
      medias: {
        orderBy: [
          { mediaType: 'asc' },
          { region: 'asc' }
        ]
      }
    },
    orderBy: {
      title: 'asc'
    }
  })
}

// Fonction pour récupérer les jeux populaires d'une console (4 max, top staff priorité, puis par note décroissante)
export async function getPopularGamesByConsoleSlug(consoleSlug: string): Promise<GameWithConsole[]> {
  return await prisma.game.findMany({
    where: {
      console: {
        slug: consoleSlug
      },
      OR: [
        { topStaff: true },  // Toujours inclure les top staff même sans note
        { 
          AND: [
            { rating: { not: null } },  // Ou inclure seulement les jeux avec une note
            { rating: { gt: 0 } }       // Et une note positive
          ]
        }
      ]
    },
    include: {
      console: true,
      medias: {
        orderBy: [
          { mediaType: 'asc' },
          { region: 'asc' }
        ]
      }
    },
    orderBy: [
      { topStaff: 'desc' },  // Top staff en premier
      { rating: 'desc' },    // Puis par note décroissante (20/20, 19/20, etc.)
      { title: 'asc' }       // En cas d'égalité, par ordre alphabétique
    ],
    take: 4  // Limiter à 4 jeux
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
export async function getHomepageFeaturedConsoles(): Promise<ConsoleWithMedias[]> {
  const featuredConsoles: ConsoleWithMedias[] = []
  
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
      },
      include: {
        medias: true
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
      },
      include: {
        medias: true
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
      },
      include: {
        medias: true
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
  
  // No fallback to image column since it's been removed
  return null
}

export function getConsoleMediasByRegion(console: ConsoleWithMedias, region: string): ConsoleMedia[] {
  if (!console.medias) return []
  
  return console.medias.filter(media => media.region === region)
}

// Fonction utilitaire pour générer le slug composé d'un jeu
export function generateGameCompositeSlug(game: Game & { console?: { slug: string } | Console }): string {
  if (game.console?.slug) {
    return `${game.slug}-console-${game.console.slug}`
  }
  return game.slug
}

// Fonction pour obtenir tous les jeux avec leur slug composé
export async function getAllGamesWithCompositeSlug(): Promise<(GameWithConsole & { compositeSlug: string })[]> {
  const games = await prisma.game.findMany({
    include: {
      console: true,
      medias: {
        orderBy: [
          { mediaType: 'asc' },
          { region: 'asc' }
        ]
      }
    },
    orderBy: {
      title: 'asc'
    }
  })
  
  return games.map(game => ({
    ...game,
    compositeSlug: generateGameCompositeSlug(game)
  }))
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
      console: true,
      medias: {
        orderBy: [
          { mediaType: 'asc' },
          { region: 'asc' }
        ]
      }
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
      console: true,
      medias: {
        orderBy: [
          { mediaType: 'asc' },
          { region: 'asc' }
        ]
      }
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
      },
      OR: [
        { topStaff: true },  // Toujours inclure les top staff même sans note
        { 
          AND: [
            { rating: { not: null } },  // Ou inclure seulement les jeux avec une note
            { rating: { gt: 0 } }       // Et une note positive
          ]
        }
      ]
    },
    orderBy: [
      { topStaff: 'desc' },  // Top staff en premier
      { rating: 'desc' },    // Puis par note décroissante
      { title: 'asc' }       // En cas d'égalité, par ordre alphabétique
    ],
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
            name: true,
            slug: true
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

// ================================
// USER DASHBOARD FUNCTIONS
// ================================

export interface UserStats {
  gamesOwned: number
  consolesOwned: number
  wishlistCount: number
  collectionValue: number
  totalPurchasePrice: number
  completedGames: number
  averageRating: number
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const [
    gamesOwned,
    consolesOwned,
    wishlistCount,
    collectionValueResult,
    completedGames,
    averageRatingResult
  ] = await Promise.all([
    prisma.userGameCollection.count({
      where: { userId }
    }),
    prisma.userConsoleCollection.count({
      where: { userId }
    }),
    prisma.userWishlist.count({
      where: { userId }
    }),
    prisma.userConsoleCollection.aggregate({
      where: { userId },
      _sum: {
        currentValue: true,
        purchasePrice: true
      }
    }),
    prisma.userGameCollection.count({
      where: { 
        userId,
        isCompleted: true
      }
    }),
    prisma.gameReview.aggregate({
      where: { userId },
      _avg: {
        rating: true
      }
    })
  ])

  return {
    gamesOwned,
    consolesOwned,
    wishlistCount,
    collectionValue: collectionValueResult._sum.currentValue || 0,
    totalPurchasePrice: collectionValueResult._sum.purchasePrice || 0,
    completedGames,
    averageRating: averageRatingResult._avg.rating || 0
  }
}

export interface UserActivity {
  action: string
  date: string
  itemName?: string
}

export async function getUserRecentActivity(userId: string): Promise<UserActivity[]> {
  const [recentCollections, recentReviews, recentWishlist] = await Promise.all([
    prisma.userConsoleCollection.findMany({
      where: { userId },
      take: 3,
      orderBy: { addedAt: 'desc' },
      include: {
        console: {
          select: { name: true }
        },
        variant: {
          select: { region: true }
        }
      }
    }),
    prisma.gameReview.findMany({
      where: { userId },
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        game: {
          select: { title: true }
        }
      }
    }),
    prisma.userWishlist.findMany({
      where: { userId },
      take: 2,
      orderBy: { createdAt: 'desc' },
      include: {
        console: {
          select: { name: true }
        },
        game: {
          select: { title: true }
        }
      }
    })
  ])

  const activities: UserActivity[] = []

  // Ajouter les collections récentes
  recentCollections.forEach(collection => {
    if (collection.console) {
      activities.push({
        action: `Ajout à la collection: ${collection.console.name} (${collection.variant?.region || 'N/A'})`,
        date: collection.addedAt.toLocaleDateString('fr-FR'),
        itemName: collection.console.name
      })
    }
  })

  // Ajouter les reviews récentes
  recentReviews.forEach(review => {
    if (review.game) {
      activities.push({
        action: `Évaluation de ${review.game.title} (${review.rating}/5)`,
        date: review.createdAt.toLocaleDateString('fr-FR'),
        itemName: review.game.title
      })
    }
  })

  // Ajouter les wishlist récentes
  recentWishlist.forEach(wish => {
    const itemName = wish.console?.name || wish.game?.title || 'Inconnu'
    activities.push({
      action: `Ajout à la wishlist: ${itemName}`,
      date: wish.createdAt.toLocaleDateString('fr-FR'),
      itemName
    })
  })

  // Trier par date décroissante et limiter à 10
  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
}

// ================================
// NOUVELLES FONCTIONS POUR LES ENTITÉS AJOUTÉES
// ================================

// Fonctions pour les Corporations
export async function getAllCorporations() {
  return await prisma.corporation.findMany({
    include: {
      _count: {
        select: {
          developedGames: true,
          publishedGames: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })
}

export async function getCorporationById(id: string) {
  return await prisma.corporation.findUnique({
    where: { id },
    include: {
      developedGames: {
        include: {
          console: true
        },
        orderBy: {
          title: 'asc'
        }
      },
      publishedGames: {
        include: {
          console: true
        },
        orderBy: {
          title: 'asc'
        }
      },
      roles: true
    }
  })
}

export async function getCorporationByName(name: string) {
  return await prisma.corporation.findUnique({
    where: { name },
    include: {
      developedGames: {
        include: {
          console: true
        }
      },
      publishedGames: {
        include: {
          console: true
        }
      }
    }
  })
}


// Fonctions pour les Générations
export async function getAllGenerations() {
  return await prisma.generation.findMany({
    include: {
      _count: {
        select: {
          consoles: true
        }
      }
    },
    orderBy: {
      startYear: 'asc'
    }
  })
}

export async function getGenerationById(id: string) {
  return await prisma.generation.findUnique({
    where: { id },
    include: {
      consoles: {
        include: {
          _count: {
            select: {
              games: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      }
    }
  })
}

// Fonctions pour les Familles
export async function getAllFamilies() {
  return await prisma.family.findMany({
    include: {
      _count: {
        select: {
          games: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })
}

export async function getFamilyById(id: string) {
  return await prisma.family.findUnique({
    where: { id },
    include: {
      games: {
        include: {
          console: true
        },
        orderBy: {
          title: 'asc'
        }
      }
    }
  })
}

// Fonctions pour récupérer les jeux avec toutes les nouvelles relations
export async function getGameWithAllRelations(slug: string) {
  if (slug.includes('-console-')) {
    const parts = slug.split('-console-')
    if (parts.length === 2) {
      const gameSlug = parts[0]
      const consoleSlug = parts[1]
      
      return await prisma.game.findFirst({
        where: {
          slug: gameSlug,
          console: {
            slug: consoleSlug
          }
        },
        include: {
          console: true,
          medias: {
            orderBy: [
              { mediaType: 'asc' },
              { region: 'asc' }
            ]
          },
          genres: {
            orderBy: { isPrimary: 'desc' }
          },
          corporationDev: true,
          corporationPub: true,
          family: true,
          manuals: true,
          videos: true
        }
      })
    }
  }
  
  return await prisma.game.findFirst({
    where: { slug },
    include: {
      console: true,
      medias: {
        orderBy: [
          { mediaType: 'asc' },
          { region: 'asc' }
        ]
      },
      genres: {
        orderBy: { isPrimary: 'desc' }
      },
      corporationDev: true,
      corporationPub: true,
      family: true,
      manuals: true,
      videos: true
    }
  })
}

// Fonctions pour récupérer les consoles avec toutes les nouvelles relations
export async function getConsoleWithAllRelations(slug: string) {
  return await prisma.console.findUnique({
    where: { slug },
    include: {
      medias: true,
      regionalNames: true,
      regionalDates: true,
      variants: true,
      games: {
        include: {
          corporationDev: true,
          corporationPub: true
        },
        orderBy: {
          title: 'asc'
        }
      },
      generation: true,
      bestSellingGame: true
    }
  })
}