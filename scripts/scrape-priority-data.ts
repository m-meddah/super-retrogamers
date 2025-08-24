#!/usr/bin/env tsx

/**
 * Script de scraping des consoles et jeux prioritaires pour le déploiement
 * Utilise les fichiers JSON de configuration pour déterminer quoi scraper
 */

import { PrismaClient } from '@prisma/client'
import { scrapeConsoleFromScreenscraper } from '@/lib/screenscraper-service'
import { createGameFromScreenscraper } from '@/lib/screenscraper-games'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

// Types pour les configurations JSON
interface PriorityConsole {
  ssConsoleId: number
  name: string
  priority: number
  note: string
}

interface PriorityGame {
  ssGameId: number
  ssConsoleId: number
  title: string
  console: string
  priority: number
  note: string
}

interface DeploymentConfig {
  scraping: {
    enablePriorityConsoles: boolean
    enablePriorityGames: boolean
    downloadMedia: boolean
    updateExistingData: boolean
    respectRateLimits: boolean
    throttleDelayMs: number
    batchSize: number
    pauseBetweenBatchesMs: number
  }
  errorHandling: {
    continueOnError: boolean
    maxRetries: number
    retryDelayMs: number
  }
  logging: {
    enableDetailedLogs: boolean
    showProgress: boolean
    showTimestamps: boolean
  }
}

interface ScrapingStats {
  consolesProcessed: number
  consolesSuccess: number
  consolesErrors: number
  gamesProcessed: number
  gamesSuccess: number
  gamesErrors: number
  totalDuration: number
  startTime: number
}

// Utilitaires
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function loadJsonConfig<T>(filename: string): T {
  const configPath = join(__dirname, 'config', filename)
  try {
    const content = readFileSync(configPath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    throw new Error(`Impossible de charger ${filename}: ${error}`)
  }
}

function log(message: string, config: DeploymentConfig) {
  const timestamp = config.logging.showTimestamps 
    ? `[${new Date().toLocaleTimeString('fr-FR')}] ` 
    : ''
  console.log(`${timestamp}${message}`)
}

function logError(message: string, error: any, config: DeploymentConfig) {
  const timestamp = config.logging.showTimestamps 
    ? `[${new Date().toLocaleTimeString('fr-FR')}] ` 
    : ''
  console.error(`${timestamp}❌ ${message}`)
  if (config.logging.enableDetailedLogs) {
    console.error(`   Détails:`, error)
  }
}

async function scrapePriorityConsoles(config: DeploymentConfig, stats: ScrapingStats): Promise<void> {
  if (!config.scraping.enablePriorityConsoles) {
    log('🎮 Scraping des consoles désactivé dans la configuration', config)
    return
  }

  log('\n🎮 === SCRAPING DES CONSOLES PRIORITAIRES ===', config)

  // Charger la configuration des consoles
  const consolesConfig = loadJsonConfig<{consoles: PriorityConsole[]}>('priority-consoles.json')
  
  // Trier par priorité (1 = plus prioritaire)
  const sortedConsoles = consolesConfig.consoles.sort((a, b) => a.priority - b.priority)
  
  log(`📊 ${sortedConsoles.length} consoles prioritaires à traiter`, config)

  for (let i = 0; i < sortedConsoles.length; i += config.scraping.batchSize) {
    const batch = sortedConsoles.slice(i, i + config.scraping.batchSize)
    const batchNum = Math.floor(i / config.scraping.batchSize) + 1
    const totalBatches = Math.ceil(sortedConsoles.length / config.scraping.batchSize)
    
    log(`\n📦 Lot ${batchNum}/${totalBatches} (${batch.length} consoles)`, config)

    for (const consoleConfig of batch) {
      let retries = 0
      let success = false

      while (retries <= config.errorHandling.maxRetries && !success) {
        try {
          stats.consolesProcessed++
          
          const retryText = retries > 0 ? ` (tentative ${retries + 1}/${config.errorHandling.maxRetries + 1})` : ''
          log(`   🔄 ${consoleConfig.name} (ID: ${consoleConfig.ssConsoleId}) [P${consoleConfig.priority}]${retryText}`, config)
          
          // Vérifier si la console existe déjà
          const existingConsole = await prisma.console.findUnique({
            where: { ssConsoleId: consoleConfig.ssConsoleId }
          })

          if (existingConsole && !config.scraping.updateExistingData) {
            log(`   ⏭️  Console déjà existante, ignorée`, config)
            stats.consolesSuccess++
            success = true
            continue
          }

          // Scraper la console
          const result = await scrapeConsoleFromScreenscraper(consoleConfig.ssConsoleId)
          
          if (result.success) {
            log(`   ✅ Succès${existingConsole ? ' (mise à jour)' : ' (création)'}`, config)
            stats.consolesSuccess++
            success = true
          } else {
            throw new Error(result.error || 'Erreur inconnue')
          }

          // Throttling
          if (config.scraping.respectRateLimits) {
            await delay(config.scraping.throttleDelayMs)
          }

        } catch (error) {
          retries++
          if (retries <= config.errorHandling.maxRetries) {
            logError(`Tentative ${retries} échouée pour ${consoleConfig.name}`, error, config)
            await delay(config.errorHandling.retryDelayMs)
          } else {
            logError(`Échec définitif pour ${consoleConfig.name} après ${config.errorHandling.maxRetries} tentatives`, error, config)
            stats.consolesErrors++
            
            if (!config.errorHandling.continueOnError) {
              throw new Error(`Arrêt suite à l'échec de ${consoleConfig.name}`)
            }
          }
        }
      }
    }

    // Pause entre les lots
    if (i + config.scraping.batchSize < sortedConsoles.length) {
      log(`   ⏸️  Pause de ${config.scraping.pauseBetweenBatchesMs}ms entre les lots...`, config)
      await delay(config.scraping.pauseBetweenBatchesMs)
    }
  }
}

async function scrapePriorityGames(config: DeploymentConfig, stats: ScrapingStats): Promise<void> {
  if (!config.scraping.enablePriorityGames) {
    log('\n🎯 Scraping des jeux désactivé dans la configuration', config)
    return
  }

  log('\n🎯 === SCRAPING DES JEUX PRIORITAIRES ===', config)

  // Charger la configuration des jeux
  const gamesConfig = loadJsonConfig<{games: PriorityGame[]}>('priority-games.json')
  
  // Trier par priorité (1 = plus prioritaire)
  const sortedGames = gamesConfig.games.sort((a, b) => a.priority - b.priority)
  
  log(`📊 ${sortedGames.length} jeux prioritaires à traiter`, config)

  for (let i = 0; i < sortedGames.length; i += config.scraping.batchSize) {
    const batch = sortedGames.slice(i, i + config.scraping.batchSize)
    const batchNum = Math.floor(i / config.scraping.batchSize) + 1
    const totalBatches = Math.ceil(sortedGames.length / config.scraping.batchSize)
    
    log(`\n📦 Lot ${batchNum}/${totalBatches} (${batch.length} jeux)`, config)

    for (const gameConfig of batch) {
      let retries = 0
      let success = false

      while (retries <= config.errorHandling.maxRetries && !success) {
        try {
          stats.gamesProcessed++
          
          const retryText = retries > 0 ? ` (tentative ${retries + 1}/${config.errorHandling.maxRetries + 1})` : ''
          log(`   🔄 ${gameConfig.title} (${gameConfig.console}) [P${gameConfig.priority}]${retryText}`, config)
          
          // Vérifier si le jeu existe déjà
          const existingGame = await prisma.game.findUnique({
            where: { ssGameId: gameConfig.ssGameId }
          })

          if (existingGame && !config.scraping.updateExistingData) {
            log(`   ⏭️  Jeu déjà existant, ignoré`, config)
            stats.gamesSuccess++
            success = true
            continue
          }

          // Vérifier que la console parent existe
          const parentConsole = await prisma.console.findUnique({
            where: { ssConsoleId: gameConfig.ssConsoleId }
          })

          if (!parentConsole) {
            throw new Error(`Console parent (ID: ${gameConfig.ssConsoleId}) introuvable pour ce jeu`)
          }

          // Scraper le jeu
          const result = await createGameFromScreenscraper(
            gameConfig.ssGameId,
            gameConfig.ssConsoleId,
            {
              updateExisting: config.scraping.updateExistingData,
              downloadMedia: config.scraping.downloadMedia
            }
          )
          
          if (result.success) {
            log(`   ✅ Succès${existingGame ? ' (mise à jour)' : ' (création)'}`, config)
            stats.gamesSuccess++
            success = true
          } else {
            throw new Error(result.error || 'Erreur inconnue')
          }

          // Throttling
          if (config.scraping.respectRateLimits) {
            await delay(config.scraping.throttleDelayMs)
          }

        } catch (error) {
          retries++
          if (retries <= config.errorHandling.maxRetries) {
            logError(`Tentative ${retries} échouée pour ${gameConfig.title}`, error, config)
            await delay(config.errorHandling.retryDelayMs)
          } else {
            logError(`Échec définitif pour ${gameConfig.title} après ${config.errorHandling.maxRetries} tentatives`, error, config)
            stats.gamesErrors++
            
            if (!config.errorHandling.continueOnError) {
              throw new Error(`Arrêt suite à l'échec de ${gameConfig.title}`)
            }
          }
        }
      }
    }

    // Pause entre les lots
    if (i + config.scraping.batchSize < sortedGames.length) {
      log(`   ⏸️  Pause de ${config.scraping.pauseBetweenBatchesMs}ms entre les lots...`, config)
      await delay(config.scraping.pauseBetweenBatchesMs)
    }
  }
}

function displayStats(stats: ScrapingStats, config: DeploymentConfig): void {
  const duration = Math.round((Date.now() - stats.startTime) / 1000 / 60 * 100) / 100
  stats.totalDuration = duration

  log('\n📈 === STATISTIQUES FINALES ===', config)
  
  const consoleSuccessRate = stats.consolesProcessed > 0 
    ? Math.round((stats.consolesSuccess / stats.consolesProcessed) * 100) 
    : 0
  
  const gameSuccessRate = stats.gamesProcessed > 0 
    ? Math.round((stats.gamesSuccess / stats.gamesProcessed) * 100) 
    : 0

  console.log(`
🎮 CONSOLES:
   - Traitées: ${stats.consolesProcessed}
   - Succès: ${stats.consolesSuccess}
   - Erreurs: ${stats.consolesErrors}
   - Taux de succès: ${consoleSuccessRate}%

🎯 JEUX:
   - Traités: ${stats.gamesProcessed}
   - Succès: ${stats.gamesSuccess}
   - Erreurs: ${stats.gamesErrors}
   - Taux de succès: ${gameSuccessRate}%

⏱️  PERFORMANCE:
   - Durée totale: ${duration} minutes
   - Démarré à: ${new Date(stats.startTime).toLocaleString('fr-FR')}
   - Terminé à: ${new Date().toLocaleString('fr-FR')}
  `)
}

async function main(): Promise<void> {
  let config: DeploymentConfig

  try {
    // Charger la configuration
    config = loadJsonConfig<DeploymentConfig>('deployment.json')
  } catch (error) {
    console.error('💥 ERREUR: Impossible de charger deployment.json:', error)
    process.exit(1)
  }

  const stats: ScrapingStats = {
    consolesProcessed: 0,
    consolesSuccess: 0,
    consolesErrors: 0,
    gamesProcessed: 0,
    gamesSuccess: 0,
    gamesErrors: 0,
    totalDuration: 0,
    startTime: Date.now()
  }

  log('🚀 DÉBUT DU SCRAPING PRIORITAIRE', config)
  log(`⏰ Démarré à: ${new Date().toLocaleString('fr-FR')}`, config)

  try {
    // Scraper les consoles prioritaires
    await scrapePriorityConsoles(config, stats)
    
    // Scraper les jeux prioritaires  
    await scrapePriorityGames(config, stats)
    
    // Afficher les statistiques
    displayStats(stats, config)
    
    const overallSuccess = (stats.consolesSuccess + stats.gamesSuccess)
    const overallTotal = (stats.consolesProcessed + stats.gamesProcessed)
    const overallRate = overallTotal > 0 ? Math.round((overallSuccess / overallTotal) * 100) : 0
    
    if (overallRate >= 80) {
      log(`\n✅ SCRAPING PRIORITAIRE TERMINÉ AVEC SUCCÈS (${overallRate}% de réussite)`, config)
    } else if (overallRate >= 50) {
      log(`\n⚠️  SCRAPING PRIORITAIRE TERMINÉ AVEC AVERTISSEMENTS (${overallRate}% de réussite)`, config)
    } else {
      log(`\n❌ SCRAPING PRIORITAIRE TERMINÉ AVEC ERREURS (${overallRate}% de réussite)`, config)
    }

  } catch (error) {
    logError('ERREUR FATALE lors du scraping prioritaire', error, config)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Gestion des signaux pour arrêt propre
process.on('SIGINT', async () => {
  console.log('\n⏹️  Arrêt demandé, nettoyage...')
  await prisma.$disconnect()
  process.exit(0)
})

// Exécution du script
if (require.main === module) {
  main()
}

export { main as scrapePriorityData }