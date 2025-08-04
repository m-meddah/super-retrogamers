import { prisma } from "@/lib/prisma"
import type { Console, Game } from "@prisma/client"

// Types pour les relations complètes
export type ConsoleWithGames = Console & {
  games: Game[]
  _count: {
    games: number
  }
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