'use server'

import { revalidatePath } from 'next/cache'
import { scrapeConsolesFromScreenscraper, rescrapConsoleMedias } from '@/lib/screenscraper-service'
import { scrapeGamesForConsole, rescrapGameMedias } from '@/lib/screenscraper-games'
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
export async function scrapeConsolesAction(): Promise<ScrapingResult> {
  try {
    // Pour le moment, on utilise toujours scrapeAllSystems
    // On pourrait ajouter une fonction scrapePrioritySystems plus tard
    await scrapeConsolesFromScreenscraper()

    // Revalidate pages that might show console data
    revalidatePath('/consoles')
    revalidatePath('/')

    // Retourner des stats approximatives
    const consolesCount = await prisma.console.count()
    
    return {
      success: true,
      data: {
        total: consolesCount,
        imported: consolesCount,
        errors: 0,
        errorDetails: []
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

// Games scraping actions (by console ID)
export async function scrapeGamesAction(
  consoleId: string,
  systemId: number,
  maxGames = 50
): Promise<ScrapingResult> {
  try {
    await scrapeGamesForConsole(consoleId, systemId, maxGames)

    // Revalidate pages that might show game data
    revalidatePath('/jeux')
    revalidatePath('/consoles')

    // Retourner des stats approximatives
    const gamesCount = await prisma.game.count({
      where: { consoleId }
    })
    
    return {
      success: true,
      data: {
        total: gamesCount,
        imported: gamesCount,
        errors: 0,
        errorDetails: []
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

// Games scraping actions (by system ID - finds console first)
export async function scrapeGamesBySystemAction(
  systemId: number,
  maxGames = 50
): Promise<ScrapingResult> {
  try {
    // Trouver la console correspondant au systemId
    const console = await prisma.console.findFirst({
      where: { screenscrapeId: systemId }
    })
    
    if (!console) {
      return {
        success: false,
        error: `Console avec screenscrapeId ${systemId} non trouvée`
      }
    }
    
    return await scrapeGamesAction(console.id, systemId, maxGames)
    
  } catch (error) {
    console.error('Scrape games by system error:', error)
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
    // Step 1: Scrape consoles
    await scrapeConsolesFromScreenscraper()
    
    const consolesCount = await prisma.console.count()
    
    if (consolesCount === 0) {
      return {
        success: false,
        error: 'Aucune console n\'a pu être importée'
      }
    }

    // Step 2: Get consoles that have screenscrapeId for games scraping
    const consoles = await prisma.console.findMany({
      where: {
        screenscrapeId: { not: null }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        screenscrapeId: true
      }
    })

    let totalGamesImported = 0
    let totalErrors = 0

    for (const gameConsole of consoles) {
      if (!gameConsole.screenscrapeId) continue
      
      try {
        await scrapeGamesForConsole(gameConsole.id, gameConsole.screenscrapeId, maxGamesPerSystem)
        
        const gameCount = await prisma.game.count({
          where: { consoleId: gameConsole.id }
        })
        
        totalGamesImported += gameCount
        
        console.log(`✅ ${gameConsole.name}: ${gameCount} jeux`)

        // Pause between systems to avoid overloading the API
        await new Promise(resolve => setTimeout(resolve, 3000))
      } catch (error) {
        console.error(`Error scraping ${gameConsole.name}:`, error)
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
        total: consolesCount + totalGamesImported,
        imported: consolesCount + totalGamesImported,
        errors: totalErrors,
        errorDetails: [
          `Consoles: ${consolesCount}`,
          `Jeux: ${totalGamesImported}`,
          `Erreurs: ${totalErrors}`
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



// Re-scrape console medias action
export async function rescrapConsoleMediasAction(
  prevState: ScrapingResult,
  formData: FormData
): Promise<ScrapingResult> {
  try {
    const consoleId = formData.get('consoleId') as string
    
    if (!consoleId) {
      return {
        success: false,
        error: 'ID console requis'
      }
    }
    
    const result = await rescrapConsoleMedias(consoleId)
    
    if (!result.success) {
      return {
        success: false,
        error: result.message
      }
    }
    
    // Revalidate pages
    revalidatePath('/consoles')
    revalidatePath(`/consoles`)
    
    return {
      success: true,
      data: {
        total: result.mediasAdded,
        imported: result.mediasAdded,
        errors: 0,
        errorDetails: [result.message]
      }
    }
  } catch (error) {
    console.error('Re-scrape console medias error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du re-scraping des médias'
    }
  }
}

// Re-scrape game medias action
export async function rescrapGameMediasAction(
  prevState: ScrapingResult,
  formData: FormData
): Promise<ScrapingResult> {
  try {
    const gameId = formData.get('gameId') as string
    
    if (!gameId) {
      return {
        success: false,
        error: 'ID jeu requis'
      }
    }
    
    const result = await rescrapGameMedias(gameId)
    
    if (!result.success) {
      return {
        success: false,
        error: result.message
      }
    }
    
    // Revalidate pages
    revalidatePath('/jeux')
    revalidatePath(`/jeux`)
    
    return {
      success: true,
      data: {
        total: result.mediasAdded,
        imported: result.mediasAdded,
        errors: 0,
        errorDetails: [result.message]
      }
    }
  } catch (error) {
    console.error('Re-scrape game medias error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du re-scraping des médias de jeu'
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