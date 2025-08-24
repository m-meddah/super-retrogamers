#!/usr/bin/env tsx

/**
 * Script de test du re-scraping sur un échantillon réduit
 * Pour valider le fonctionnement avant le re-scraping complet
 */

import { PrismaClient } from '@prisma/client'
import { scrapeConsoleFromScreenscraper } from '@/lib/screenscraper-service'
import { createGameFromScreenscraper } from '@/lib/screenscraper-games'

const prisma = new PrismaClient()

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testConsoleRescraping() {
  console.log('\n🎮 === TEST RE-SCRAPING CONSOLE ===')
  
  // Prendre la première console avec ssConsoleId
  const console = await prisma.console.findFirst({
    where: {
      ssConsoleId: { not: null }
    },
    select: {
      id: true,
      slug: true,
      name: true,
      ssConsoleId: true,
      updatedAt: true
    }
  })

  if (!console) {
    console.log('❌ Aucune console avec ssConsoleId trouvée')
    return false
  }

  console.log(`🔄 Test avec: ${console.name} (ID: ${console.ssConsoleId})`)
  console.log(`   Dernière mise à jour: ${console.updatedAt.toLocaleString('fr-FR')}`)

  try {
    const result = await scrapeConsoleFromScreenscraper(console.ssConsoleId!)
    
    if (result.success) {
      console.log(`   ✅ Succès: Console mise à jour`)
      
      // Vérifier les changements
      const updatedConsole = await prisma.console.findUnique({
        where: { id: console.id },
        select: { updatedAt: true, description: true }
      })
      
      if (updatedConsole && updatedConsole.updatedAt > console.updatedAt) {
        console.log(`   📅 Nouvelle mise à jour: ${updatedConsole.updatedAt.toLocaleString('fr-FR')}`)
      }
      
      return true
    } else {
      console.log(`   ❌ Échec: ${result.error}`)
      return false
    }
  } catch (error) {
    console.error(`   💥 Erreur:`, error)
    return false
  }
}

async function testGameRescraping() {
  console.log('\n🎯 === TEST RE-SCRAPING JEU ===')
  
  // Prendre le premier jeu avec ssGameId
  const game = await prisma.game.findFirst({
    where: {
      ssGameId: { not: null }
    },
    include: {
      console: {
        select: {
          ssConsoleId: true,
          name: true
        }
      }
    }
  })

  if (!game) {
    console.log('❌ Aucun jeu avec ssGameId trouvé')
    return false
  }

  console.log(`🔄 Test avec: ${game.title} (ID: ${game.ssGameId})`)
  console.log(`   Console: ${game.console?.name}`)
  console.log(`   Dernière mise à jour: ${game.updatedAt.toLocaleString('fr-FR')}`)

  if (!game.console?.ssConsoleId) {
    console.log('   ❌ Console sans ssConsoleId, test impossible')
    return false
  }

  try {
    const result = await createGameFromScreenscraper(
      game.ssGameId!,
      game.console.ssConsoleId,
      { 
        updateExisting: true,
        downloadMedia: false // Pas de téléchargement pour le test
      }
    )
    
    if (result.success) {
      console.log(`   ✅ Succès: Jeu mis à jour`)
      
      // Vérifier les changements
      const updatedGame = await prisma.game.findUnique({
        where: { id: game.id },
        select: { updatedAt: true, description: true }
      })
      
      if (updatedGame && updatedGame.updatedAt > game.updatedAt) {
        console.log(`   📅 Nouvelle mise à jour: ${updatedGame.updatedAt.toLocaleString('fr-FR')}`)
      }
      
      return true
    } else {
      console.log(`   ❌ Échec: ${result.error}`)
      return false
    }
  } catch (error) {
    console.error(`   💥 Erreur:`, error)
    return false
  }
}

async function checkDatabaseState() {
  console.log('\n📊 === ÉTAT DE LA BASE DE DONNÉES ===')
  
  const stats = await Promise.all([
    prisma.console.count(),
    prisma.console.count({ where: { ssConsoleId: { not: null } } }),
    prisma.game.count(),
    prisma.game.count({ where: { ssGameId: { not: null } } }),
    prisma.family.count(),
    prisma.corporation.count(),
    prisma.mediaUrlCache.count(),
    prisma.generation.count()
  ])

  console.log(`
📈 COMPTEURS:
   - Consoles total: ${stats[0]}
   - Consoles avec ssConsoleId: ${stats[1]}
   - Jeux total: ${stats[2]}
   - Jeux avec ssGameId: ${stats[3]}
   - Familles: ${stats[4]}
   - Corporations: ${stats[5]}
   - Cache média: ${stats[6]}
   - Générations: ${stats[7]}
  `)

  // Vérifier l'état de la table manuals (devrait être vide)
  const manualsCount = await prisma.manual.count()
  console.log(`   - Manuels: ${manualsCount} (devrait être 0 - table modifiée)`)

  return {
    consolesToRescrape: stats[1],
    gamesToRescrape: stats[3],
    totalEntries: stats[0] + stats[2] + stats[4] + stats[5]
  }
}

async function main() {
  console.log('🧪 DÉBUT DU TEST DE RE-SCRAPING')
  console.log(`⏰ Démarré à: ${new Date().toLocaleString('fr-FR')}`)
  
  try {
    // 1. Vérifier l'état initial
    const initialState = await checkDatabaseState()
    
    if (initialState.consolesToRescrape === 0 && initialState.gamesToRescrape === 0) {
      console.log('\n⚠️  Aucune donnée à re-scraper trouvée!')
      console.log('   Vous devez d\'abord avoir des consoles/jeux avec des IDs Screenscraper')
      return
    }
    
    console.log(`\n🎯 Données à re-scraper trouvées:`)
    console.log(`   - ${initialState.consolesToRescrape} consoles`)
    console.log(`   - ${initialState.gamesToRescrape} jeux`)
    
    // 2. Test re-scraping console
    const consoleSuccess = await testConsoleRescraping()
    
    // Délai entre les tests
    await delay(1500)
    
    // 3. Test re-scraping jeu  
    const gameSuccess = await testGameRescraping()
    
    // 4. Résumé
    console.log('\n📋 === RÉSUMÉ DU TEST ===')
    console.log(`   🎮 Console: ${consoleSuccess ? '✅ SUCCÈS' : '❌ ÉCHEC'}`)
    console.log(`   🎯 Jeu: ${gameSuccess ? '✅ SUCCÈS' : '❌ ÉCHEC'}`)
    
    if (consoleSuccess && gameSuccess) {
      console.log('\n🎉 TOUS LES TESTS RÉUSSIS!')
      console.log('   Le re-scraping complet peut être lancé avec:')
      console.log('   npx tsx scripts/rescrape-all-data.ts')
    } else {
      console.log('\n⚠️  CERTAINS TESTS ONT ÉCHOUÉ')
      console.log('   Vérifiez la configuration Screenscraper et les logs ci-dessus')
    }
    
  } catch (error) {
    console.error('\n💥 ERREUR FATALE:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécution du script
if (require.main === module) {
  main()
}

export { main as testRescraping }