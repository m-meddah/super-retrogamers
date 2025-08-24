#!/usr/bin/env tsx

/**
 * Script de re-scraping complet pour mettre à jour toutes les données
 * Consoles, jeux, familles, corporations et médias
 */

import { PrismaClient } from '@prisma/client'
import { scrapeConsoleFromScreenscraper } from '@/lib/screenscraper-service'
import { createGameFromScreenscraper } from '@/lib/screenscraper-games'
import { scrapeGenresFromScreenscraper } from '@/lib/screenscraper-genres'
import { screenscrapeClient } from '@/lib/screenscraper-client'

const prisma = new PrismaClient()

// Configuration
const BATCH_SIZE = 10 // Traiter par lots pour éviter la surcharge
const DELAY_BETWEEN_BATCHES = 2000 // 2 secondes entre les lots
const THROTTLE_DELAY = 1200 // 1.2s entre chaque requête API

interface RescrapeStats {
  consolesProcessed: number
  consolesUpdated: number
  consolesErrors: number
  gamesProcessed: number
  gamesUpdated: number
  gamesErrors: number
  familiesUpdated: number
  corporationsUpdated: number
  mediaCacheUpdated: number
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function rescrapeConsoles(stats: RescrapeStats) {
  console.log('\n🎮 === RE-SCRAPING DES CONSOLES ===')
  
  // Récupérer toutes les consoles avec ssConsoleId
  const consoles = await prisma.console.findMany({
    where: {
      ssConsoleId: { not: null }
    },
    select: {
      id: true,
      slug: true,
      name: true,
      ssConsoleId: true
    },
    orderBy: { name: 'asc' }
  })

  console.log(`📊 ${consoles.length} consoles à re-scraper`)

  for (let i = 0; i < consoles.length; i += BATCH_SIZE) {
    const batch = consoles.slice(i, i + BATCH_SIZE)
    console.log(`\n📦 Lot ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(consoles.length / BATCH_SIZE)} (${batch.length} consoles)`)

    for (const console of batch) {
      try {
        console.log(`   🔄 ${console.name} (ID: ${console.ssConsoleId})`)
        
        if (!console.ssConsoleId) {
          console.log(`   ⚠️  Pas d'ID Screenscraper, ignoré`)
          continue
        }

        // Re-scraper la console depuis Screenscraper
        const result = await scrapeConsoleFromScreenscraper(console.ssConsoleId)
        
        if (result.success) {
          console.log(`   ✅ Mise à jour réussie`)
          stats.consolesUpdated++
        } else {
          console.log(`   ❌ Échec: ${result.error}`)
          stats.consolesErrors++
        }
        
        stats.consolesProcessed++
        
        // Throttling pour respecter les limites API
        await delay(THROTTLE_DELAY)
        
      } catch (error) {
        console.error(`   💥 Erreur pour ${console.name}:`, error)
        stats.consolesErrors++
      }
    }

    // Pause entre les lots
    if (i + BATCH_SIZE < consoles.length) {
      console.log(`   ⏸️  Pause de ${DELAY_BETWEEN_BATCHES}ms...`)
      await delay(DELAY_BETWEEN_BATCHES)
    }
  }
}

async function rescrapeGames(stats: RescrapeStats) {
  console.log('\n🎯 === RE-SCRAPING DES JEUX ===')
  
  // Récupérer tous les jeux avec ssGameId
  const games = await prisma.game.findMany({
    where: {
      ssGameId: { not: null }
    },
    select: {
      id: true,
      title: true,
      ssGameId: true,
      console: {
        select: {
          ssConsoleId: true,
          name: true
        }
      }
    },
    orderBy: { title: 'asc' }
  })

  console.log(`📊 ${games.length} jeux à re-scraper`)

  for (let i = 0; i < games.length; i += BATCH_SIZE) {
    const batch = games.slice(i, i + BATCH_SIZE)
    console.log(`\n📦 Lot ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(games.length / BATCH_SIZE)} (${batch.length} jeux)`)

    for (const game of batch) {
      try {
        console.log(`   🔄 ${game.title} (ID: ${game.ssGameId})`)
        
        if (!game.ssGameId || !game.console?.ssConsoleId) {
          console.log(`   ⚠️  Données manquantes, ignoré`)
          continue
        }

        // Re-scraper le jeu depuis Screenscraper
        const result = await createGameFromScreenscraper(
          game.ssGameId,
          game.console.ssConsoleId,
          { 
            updateExisting: true, // Forcer la mise à jour
            downloadMedia: true   // Re-télécharger les médias
          }
        )
        
        if (result.success) {
          console.log(`   ✅ Mise à jour réussie`)
          stats.gamesUpdated++
        } else {
          console.log(`   ❌ Échec: ${result.error}`)
          stats.gamesErrors++
        }
        
        stats.gamesProcessed++
        
        // Throttling pour respecter les limites API
        await delay(THROTTLE_DELAY)
        
      } catch (error) {
        console.error(`   💥 Erreur pour ${game.title}:`, error)
        stats.gamesErrors++
      }
    }

    // Pause entre les lots
    if (i + BATCH_SIZE < games.length) {
      console.log(`   ⏸️  Pause de ${DELAY_BETWEEN_BATCHES}ms...`)
      await delay(DELAY_BETWEEN_BATCHES)
    }
  }
}

async function updateGenres(stats: RescrapeStats) {
  console.log('\n🏷️  === MISE À JOUR DES GENRES ===')
  
  try {
    const result = await scrapeGenresFromScreenscraper()
    if (result.success) {
      console.log(`   ✅ ${result.genresCreated} genres créés, ${result.genresUpdated} mis à jour`)
    } else {
      console.log(`   ❌ Échec de la mise à jour des genres: ${result.error}`)
    }
  } catch (error) {
    console.error('   💥 Erreur lors de la mise à jour des genres:', error)
  }
}

async function cleanupMediaCache() {
  console.log('\n🧹 === NETTOYAGE DU CACHE MÉDIA ===')
  
  try {
    // Supprimer les entrées de cache expirées (plus de 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const deletedCache = await prisma.mediaUrlCache.deleteMany({
      where: {
        createdAt: { lt: yesterday }
      }
    })
    
    console.log(`   ✅ ${deletedCache.count} entrées de cache expirées supprimées`)
    
    // Supprimer les entrées orphelines (jeux/consoles supprimés)
    const orphanedGameCache = await prisma.mediaUrlCache.deleteMany({
      where: {
        gameId: { not: null },
        game: null
      }
    })
    
    const orphanedConsoleCache = await prisma.mediaUrlCache.deleteMany({
      where: {
        consoleId: { not: null },
        console: null
      }
    })
    
    console.log(`   ✅ ${orphanedGameCache.count + orphanedConsoleCache.count} entrées orphelines supprimées`)
    
  } catch (error) {
    console.error('   💥 Erreur lors du nettoyage:', error)
  }
}

async function displayStats(stats: RescrapeStats) {
  console.log('\n📈 === STATISTIQUES FINALES ===')
  console.log(`
🎮 CONSOLES:
   - Traitées: ${stats.consolesProcessed}
   - Mises à jour: ${stats.consolesUpdated}
   - Erreurs: ${stats.consolesErrors}
   - Taux de succès: ${stats.consolesProcessed > 0 ? Math.round((stats.consolesUpdated / stats.consolesProcessed) * 100) : 0}%

🎯 JEUX:
   - Traités: ${stats.gamesProcessed}  
   - Mis à jour: ${stats.gamesUpdated}
   - Erreurs: ${stats.gamesErrors}
   - Taux de succès: ${stats.gamesProcessed > 0 ? Math.round((stats.gamesUpdated / stats.gamesProcessed) * 100) : 0}%

📊 TOTAUX:
   - Total traité: ${stats.consolesProcessed + stats.gamesProcessed}
   - Total mis à jour: ${stats.consolesUpdated + stats.gamesUpdated}
   - Total erreurs: ${stats.consolesErrors + stats.gamesErrors}
  `)

  // Statistiques de la base de données après re-scraping
  const dbStats = await Promise.all([
    prisma.console.count(),
    prisma.game.count(),
    prisma.family.count(), 
    prisma.corporation.count(),
    prisma.mediaUrlCache.count()
  ])

  console.log(`
💾 BASE DE DONNÉES (après re-scraping):
   - Consoles: ${dbStats[0]}
   - Jeux: ${dbStats[1]}
   - Familles: ${dbStats[2]}
   - Corporations: ${dbStats[3]}
   - Cache média: ${dbStats[4]} entrées
  `)
}

async function main() {
  const startTime = Date.now()
  console.log('🚀 DÉBUT DU RE-SCRAPING COMPLET')
  console.log(`⏰ Démarré à: ${new Date().toLocaleString('fr-FR')}`)
  
  const stats: RescrapeStats = {
    consolesProcessed: 0,
    consolesUpdated: 0,
    consolesErrors: 0,
    gamesProcessed: 0,
    gamesUpdated: 0,
    gamesErrors: 0,
    familiesUpdated: 0,
    corporationsUpdated: 0,
    mediaCacheUpdated: 0
  }

  try {
    // ÉTAPE CRITIQUE: Vérifier que les genres sont synchronisés
    const genreCount = await prisma.genre.count()
    if (genreCount === 0) {
      console.error('❌ ERREUR CRITIQUE: Aucun genre en base!')
      console.error('   Lancez d\'abord: npx tsx scripts/prepare-rescraping.ts')
      process.exit(1)
    }
    console.log(`✅ ${genreCount} genres disponibles`)
    
    // 1. Mise à jour des genres en premier (au cas où)
    await updateGenres(stats)
    
    // 2. Re-scraping des consoles
    await rescrapeConsoles(stats)
    
    // 3. Re-scraping des jeux (qui met aussi à jour familles et corporations)
    await rescrapeGames(stats)
    
    // 4. Nettoyage du cache média
    await cleanupMediaCache()
    
    // 5. Statistiques finales
    await displayStats(stats)
    
    const duration = Math.round((Date.now() - startTime) / 1000 / 60)
    console.log(`\n✅ RE-SCRAPING TERMINÉ EN ${duration} MINUTES`)
    
  } catch (error) {
    console.error('\n💥 ERREUR FATALE:', error)
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

export { main as rescrapeAllData }