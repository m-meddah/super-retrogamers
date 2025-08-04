'use server'

import { revalidatePath } from 'next/cache'
import { getScreenscraperScraper } from '@/lib/scraper'
import { prisma } from '@/lib/prisma'

export interface ScrapingResult {
  success: boolean
  data?: {
    total: number
    imported: number
    errors: number
    errorDetails?: string[]
  }
  error?: string
}

// Console scraping actions
export async function scrapeConsolesAction(
  mode: 'priority' | 'all' = 'priority'
): Promise<ScrapingResult> {
  try {
    const scraper = getScreenscraperScraper()
    
    let result
    if (mode === 'all') {
      result = await scraper.scrapeAllSystems()
    } else {
      result = await scraper.scrapePrioritySystems()
    }

    // Revalidate pages that might show console data
    revalidatePath('/consoles')
    revalidatePath('/')

    return {
      success: true,
      data: {
        total: result.total,
        imported: result.imported,
        errors: result.errors.length,
        errorDetails: result.errors
      }
    }
  } catch (error) {
    console.error('Scrape consoles error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du scraping des consoles'
    }
  }
}

// Games scraping actions
export async function scrapeGamesAction(
  systemId: number,
  maxGames = 50
): Promise<ScrapingResult> {
  try {
    const scraper = getScreenscraperScraper()
    const result = await scraper.scrapeGamesForSystem(systemId, maxGames)

    // Revalidate pages that might show game data
    revalidatePath('/jeux')
    revalidatePath('/consoles')

    return {
      success: true,
      data: {
        total: result.total,
        imported: result.imported,
        errors: result.errors.length,
        errorDetails: result.errors
      }
    }
  } catch (error) {
    console.error('Scrape games error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du scraping des jeux'
    }
  }
}

// Full scraping action
export async function scrapeFullAction(
  maxGamesPerSystem = 25
): Promise<ScrapingResult> {
  try {
    const scraper = getScreenscraperScraper()
    
    // Step 1: Scrape priority consoles
    const consolesResult = await scraper.scrapePrioritySystems()
    
    if (consolesResult.imported === 0) {
      return {
        success: false,
        error: 'Aucune console n\'a pu être importée'
      }
    }

    // Step 2: Scrape games for each system
    const systemsToScrape = [
      { id: 3, name: 'NES' },
      { id: 4, name: 'SNES' },
      { id: 9, name: 'Game Boy' },
      { id: 10, name: 'Game Boy Color' },
      { id: 12, name: 'Game Boy Advance' },
      { id: 1, name: 'Sega Genesis' },
      { id: 14, name: 'Nintendo 64' },
      { id: 57, name: 'PlayStation' },
      { id: 58, name: 'PlayStation 2' },
    ]

    const gamesResults = []
    let totalGamesImported = 0
    let totalGamesFound = 0
    let totalErrors = 0

    for (const system of systemsToScrape) {
      try {
        const result = await scraper.scrapeGamesForSystem(system.id, maxGamesPerSystem)
        gamesResults.push({
          systemId: system.id,
          systemName: system.name,
          total: result.total,
          imported: result.imported,
          errors: result.errors.length
        })
        
        totalGamesImported += result.imported
        totalGamesFound += result.total
        totalErrors += result.errors.length

        // Pause between systems to avoid overloading the API
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`Error scraping ${system.name}:`, error)
        totalErrors += 1
      }
    }

    // Revalidate all relevant pages
    revalidatePath('/consoles')
    revalidatePath('/jeux')
    revalidatePath('/')

    return {
      success: true,
      data: {
        total: consolesResult.total + totalGamesFound,
        imported: consolesResult.imported + totalGamesImported,
        errors: consolesResult.errors.length + totalErrors,
        errorDetails: [
          `Consoles: ${consolesResult.imported}/${consolesResult.total}`,
          `Jeux: ${totalGamesImported}/${totalGamesFound}`,
          ...consolesResult.errors.slice(0, 5), // Limit error details
        ]
      }
    }
  } catch (error) {
    console.error('Full scrape error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du scraping complet'
    }
  }
}

// Get scraping status
export async function getScrapingStatusAction() {
  try {
    // Get database statistics
    const [consolesCount, gamesCount, consolesWithScreenscraper, gamesWithScreenscraper] = 
      await Promise.all([
        prisma.console.count(),
        prisma.game.count(),
        prisma.console.count({ where: { screenscrapeId: { not: null } } }),
        prisma.game.count({ where: { screenscrapeId: { not: null } } }),
      ])

    // Get games by console
    const gamesByConsole = await prisma.console.findMany({
      select: {
        id: true,
        name: true,
        screenscrapeId: true,
        _count: {
          select: {
            games: true
          }
        }
      },
      where: {
        screenscrapeId: {
          not: null
        }
      },
      orderBy: {
        games: {
          _count: 'desc'
        }
      }
    })

    // Get recent imports
    const recentConsoles = await prisma.console.findMany({
      where: { screenscrapeId: { not: null } },
      select: {
        name: true,
        screenscrapeId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    const recentGames = await prisma.game.findMany({
      where: { screenscrapeId: { not: null } },
      select: {
        title: true,
        screenscrapeId: true,
        createdAt: true,
        console: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return {
      success: true,
      data: {
        consoles: {
          total: consolesCount,
          fromScreenscraper: consolesWithScreenscraper,
          manual: consolesCount - consolesWithScreenscraper
        },
        games: {
          total: gamesCount,
          fromScreenscraper: gamesWithScreenscraper,
          manual: gamesCount - gamesWithScreenscraper
        },
        gamesByConsole: gamesByConsole.map(console => ({
          consoleName: console.name,
          screenscrapeId: console.screenscrapeId,
          gamesCount: console._count.games
        })),
        recent: {
          consoles: recentConsoles,
          games: recentGames
        },
        summary: {
          totalItems: consolesCount + gamesCount,
          fromScreenscraper: consolesWithScreenscraper + gamesWithScreenscraper,
          lastUpdate: recentGames[0]?.createdAt || recentConsoles[0]?.createdAt || null
        }
      }
    }
  } catch (error) {
    console.error('Get scraping status error:', error)
    return {
      success: false,
      error: 'Erreur lors de la récupération du statut'
    }
  }
}