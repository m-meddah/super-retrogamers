'use server'

import { prisma } from '@/lib/prisma'
import { getGlobalAnalytics, getMostViewedPages } from '@/lib/analytics-service'

export interface AnalyticsData {
  totalGames: number
  totalConsoles: number  
  totalUsers: number
  recentViews: number
  popularConsoles: Array<{
    name: string
    gameCount: number
  }>
  popularGames: Array<{
    title: string
    viewCount: number
    consoleName?: string
  }>
}

export async function getAnalyticsDataAction(): Promise<AnalyticsData> {
  try {
    // Récupérer les totaux
    const [totalGames, totalConsoles, totalUsers] = await Promise.all([
      prisma.game.count(),
      prisma.console.count(),
      prisma.user.count()
    ])

    // Consoles populaires (par nombre de jeux)
    const consolesWithGameCount = await prisma.console.findMany({
      select: {
        name: true,
        _count: {
          select: {
            games: true
          }
        }
      },
      orderBy: {
        games: {
          _count: 'desc'
        }
      },
      take: 5
    })

    const popularConsoles = consolesWithGameCount.map(console => ({
      name: console.name,
      gameCount: console._count.games
    }))

    // Récupérer les vraies analytics
    const globalAnalytics = await getGlobalAnalytics()
    const mostViewedPages = await getMostViewedPages(5)
    
    // Extraire les jeux populaires des pages vues
    const gamePages = mostViewedPages.filter(page => page.path.startsWith('/jeux/'))
    
    // Récupérer les détails des jeux les plus vus
    const popularGames = await Promise.all(
      gamePages.slice(0, 5).map(async (page) => {
        const gameSlug = page.path.replace('/jeux/', '')
        const game = await prisma.game.findFirst({
          where: { slug: gameSlug },
          select: {
            title: true,
            console: {
              select: {
                name: true
              }
            }
          }
        })
        
        return {
          title: game?.title || `Jeu (${gameSlug})`,
          viewCount: page.viewCount,
          consoleName: game?.console?.name
        }
      })
    )

    const recentViews = globalAnalytics.recentViews

    return {
      totalGames,
      totalConsoles,
      totalUsers,
      recentViews,
      popularConsoles,
      popularGames
    }

  } catch (error) {
    console.error('Erreur lors de la récupération des analytics:', error)
    
    // Retourner des données par défaut en cas d'erreur
    return {
      totalGames: 0,
      totalConsoles: 0,
      totalUsers: 0,
      recentViews: 0,
      popularConsoles: [],
      popularGames: []
    }
  }
}

export async function getDetailedStatsAction() {
  try {
    // Statistiques détaillées par console
    const consoleStats = await prisma.console.findMany({
      select: {
        name: true,
        slug: true,
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

    // Statistiques par année de sortie
    const yearStats = await prisma.game.groupBy({
      by: ['releaseYear'],
      _count: {
        id: true
      },
      where: {
        releaseYear: {
          not: null
        }
      },
      orderBy: {
        releaseYear: 'asc'
      }
    })

    // Statistiques par genre (si disponible)
    const genreStats = await prisma.game.groupBy({
      by: ['genreId'],
      _count: {
        id: true
      },
      where: {
        genreId: {
          not: null
        }
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    })

    // Activité récente (derniers jeux ajoutés)
    const recentActivity = await prisma.game.findMany({
      select: {
        title: true,
        createdAt: true,
        console: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    return {
      consoleStats: consoleStats.map(c => ({
        name: c.name,
        slug: c.slug,
        gameCount: c._count.games
      })),
      yearStats: yearStats.map(y => ({
        year: y.releaseYear,
        count: y._count.id
      })),
      genreStats: genreStats.map(g => ({
        genre: g.genreId || 'Non classé',
        count: g._count && typeof g._count === 'object' && 'id' in g._count ? g._count.id : 0
      })),
      recentActivity: recentActivity.map(a => ({
        title: a.title,
        consoleName: a.console?.name,
        createdAt: a.createdAt
      }))
    }

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques détaillées:', error)
    return {
      consoleStats: [],
      yearStats: [],
      genreStats: [],
      recentActivity: []
    }
  }
}

export async function getUserStatsAction() {
  try {
    // Statistiques utilisateurs (pour usage futur si besoin)
    // const userRegistrations = await prisma.user.groupBy({
    //   by: ['createdAt'],
    //   _count: {
    //     id: true
    //   },
    //   orderBy: {
    //     createdAt: 'desc'
    //   }
    // })

    // Grouper par mois pour les 12 derniers mois
    const now = new Date()
    const monthlyStats = []
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextMonth
          }
        }
      })

      monthlyStats.push({
        month: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        count
      })
    }

    return {
      totalUsers: await prisma.user.count(),
      monthlyRegistrations: monthlyStats,
      recentUsers: await prisma.user.findMany({
        select: {
          name: true,
          email: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      })
    }

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques utilisateurs:', error)
    return {
      totalUsers: 0,
      monthlyRegistrations: [],
      recentUsers: []
    }
  }
}