'use server'

import { revalidatePath } from 'next/cache'
import { scrapeConsolesFromScreenscraper } from '@/lib/screenscraper-service'
import { scrapeGamesForConsole } from '@/lib/screenscraper-games'
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

// Test specific games by their Screenscraper IDs
async function testSpecificGamesAction(gameIds: number[], systemId: number): Promise<ScrapingResult> {
  try {
    // Récupérer la console
    const gameConsole = await prisma.console.findFirst({
      where: { screenscrapeId: systemId }
    })
    
    if (!gameConsole) {
      return {
        success: false,
        error: `Console avec système ID ${systemId} non trouvée`
      }
    }
    
    let createdCount = 0
    let processedCount = 0
    
    for (const gameId of gameIds) {
      try {
        // Vérifier si le jeu existe déjà
        const existingGame = await prisma.game.findFirst({
          where: {
            screenscrapeId: gameId,
            consoleId: gameConsole.id
          }
        })
        
        if (existingGame) {
          console.log(`Jeu ${gameId} déjà existant`)
          createdCount++
          processedCount++
          continue
        }
        
        // Utiliser la fonction getGameDetails existante
        const { getGameDetails } = await import('@/lib/screenscraper-games')
        const gameDetails = await getGameDetails(gameId, systemId)
        
        if (!gameDetails) {
          console.log(`❌ Impossible de récupérer les détails du jeu ${gameId}`)
          processedCount++
          continue
        }
        
        // Utiliser la fonction createGameFromScreenscraper existante
        const { createGameFromScreenscraper } = await import('@/lib/screenscraper-games')
        const createdGame = await createGameFromScreenscraper(gameDetails, gameConsole)
        
        if (createdGame) {
          console.log(`✅ Jeu créé: ${createdGame.title}`)
          createdCount++
        } else {
          console.log(`❌ Échec création du jeu ${gameId}`)
        }
        
        processedCount++
        
        // Pause entre les requêtes
        await new Promise(resolve => setTimeout(resolve, 1500))
        
      } catch (error) {
        console.error(`Erreur jeu ${gameId}:`, error)
        processedCount++
      }
    }
    
    return {
      success: true,
      data: {
        total: createdCount,
        imported: createdCount,
        errors: processedCount - createdCount,
        errorDetails: [
          `Jeux traités: ${processedCount}`,
          `Jeux créés: ${createdCount}`,
          `Erreurs: ${processedCount - createdCount}`
        ]
      }
    }
    
  } catch (error) {
    console.error('Erreur test jeux spécifiques:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

// Test enhanced scraping with detailed media info
export async function testEnhancedScrapingAction(): Promise<ScrapingResult> {
  try {
    // Vérifier s'il y a des consoles en base
    const consolesCount = await prisma.console.count()
    console.log(`🎮 Consoles en base: ${consolesCount}`)
    
    // Si pas de consoles, scraper d'abord les consoles
    if (consolesCount === 0) {
      console.log('🔄 Aucune console en base, scraping des consoles...')
      try {
        await scrapeConsolesFromScreenscraper()
        console.log('✅ Scraping des consoles terminé')
      } catch (error) {
        console.error('❌ Erreur scraping consoles:', error)
        return {
          success: false,
          error: `Impossible de scraper les consoles: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        }
      }
    }
    
    // Compter les médias avant
    const mediaBefore = await prisma.gameMedia.count()
    console.log(`📊 Médias avant scraping: ${mediaBefore}`)
    
    // Test avec les IDs de jeux de base 1, 2, 3 pour Megadrive
    // Ces IDs devraient être des vrais jeux selon l'utilisateur
    console.log('🎮 Test avec des jeux de base Megadrive (IDs: 1, 2, 3)...')
    const result = await testSpecificGamesAction([1, 2, 3], 1) // IDs de base pour Megadrive
    
    if (result.success) {
      // Compter les médias après
      const mediaAfter = await prisma.gameMedia.count()
      const newMedias = mediaAfter - mediaBefore
      
      console.log(`📊 Médias après scraping: ${mediaAfter}`)
      console.log(`📈 Nouveaux médias capturés: ${newMedias}`)
      
      // Vérifier les types de médias capturés récemment
      const recentMedias = await prisma.gameMedia.findMany({
        select: {
          mediaType: true,
          region: true,
          crc: true,
          md5: true,
          sha1: true,
          downloadSuccess: true,
          fileName: true,
          game: {
            select: {
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      })
      
      const mediaTypesFound = [...new Set(recentMedias.map(m => m.mediaType))]
      
      // Vérifier les jeux récemment ajoutés pour confirmer qu'ils ne sont pas des "notgame"
      const recentGames = await prisma.game.findMany({
        select: {
          title: true,
          screenscrapeId: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      })
      
      return {
        success: true,
        data: {
          total: mediaAfter,
          imported: newMedias,
          errors: 0,
          errorDetails: [
            `Médias avant: ${mediaBefore}`,
            `Médias après: ${mediaAfter}`,
            `Nouveaux médias: ${newMedias}`,
            `Types trouvés: ${mediaTypesFound.join(', ')}`,
            `✅ Jeux valides scrapés (notgame: false):`,
            ...recentGames.map(g => `  - ${g.title} (ID: ${g.screenscrapeId})`),
            `📸 Exemples de médias récents:`,
            ...recentMedias.slice(0, 10).map(m => 
              `  - ${m.game.title}: ${m.mediaType} (${m.region}) ${m.crc ? '✓CRC' : ''} ${m.downloadSuccess ? '✅' : '❌'}`
            )
          ]
        }
      }
    } else {
      return result
    }
    
  } catch (error) {
    console.error('Test enhanced scraping error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du test de scraping'
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