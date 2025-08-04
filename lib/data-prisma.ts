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

// Fonctions de recherche
export async function searchConsoles(query: string): Promise<Console[]> {
  return await prisma.console.findMany({
    where: {
      OR: [
        {
          name: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          manufacturer: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: query,
            mode: 'insensitive'
          }
        }
      ]
    },
    orderBy: {
      releaseYear: 'asc'
    }
  })
}

export async function searchGames(query: string): Promise<GameWithConsole[]> {
  return await prisma.game.findMany({
    where: {
      OR: [
        {
          title: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          developer: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          publisher: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: query,
            mode: 'insensitive'
          }
        }
      ]
    },
    include: {
      console: true
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