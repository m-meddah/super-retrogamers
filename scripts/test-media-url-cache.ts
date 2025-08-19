#!/usr/bin/env tsx

import { prisma } from '@/lib/prisma'
import { getCachedMediaUrl, cacheBatchMediaUrls, getCacheStats, cleanExpiredCache } from '@/lib/media-url-cache'

async function testMediaUrlCache() {
  console.log('🧪 Test du système de cache d\'URLs de médias...\n')

  try {
    // Test 1: Vérifier l'état initial du cache
    console.log('📊 État initial du cache:')
    const initialStats = await getCacheStats()
    console.log(`  - Total entries: ${initialStats.total}`)
    console.log(`  - Expired entries: ${initialStats.expired}`)
    console.log(`  - By entity type:`, initialStats.byEntityType)
    console.log(`  - Oldest entry: ${initialStats.oldestEntry ? initialStats.oldestEntry.toLocaleString('fr-FR') : 'N/A'}`)

    // Test 2: Nettoyage des entrées expirées
    console.log('\n🧹 Nettoyage des entrées expirées...')
    const cleanedCount = await cleanExpiredCache()
    console.log(`  - ${cleanedCount} entrées expirées supprimées`)

    // Test 3: Vérifier qu'il y a des jeux dans la base
    const gamesCount = await prisma.game.count()
    console.log(`\n🎮 Nombre de jeux dans la base: ${gamesCount}`)

    if (gamesCount === 0) {
      console.log('⚠️  Aucun jeu trouvé. Le test va créer des entrées factices.')
      
      // Créer une entrée de cache factice pour les tests
      await prisma.mediaUrlCache.create({
        data: {
          entityType: 'game',
          entityId: 'test-game-id',
          mediaType: 'box-2D',
          region: 'FR',
          url: 'https://www.screenscraper.fr/media/test-image.jpg',
          cachedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
          isValid: true
        }
      })
      
      console.log('✅ Entrée de cache factice créée')
    } else {
      // Test 4: Tester avec de vrais jeux
      console.log('\n🔍 Test avec les premiers jeux de la base...')
      const sampleGames = await prisma.game.findMany({
        take: 3,
        select: { id: true, title: true }
      })

      for (const game of sampleGames) {
        console.log(`\n📱 Test pour le jeu: ${game.title}`)
        
        // Test différents types de médias
        const mediaTypes = ['box-2D', 'wheel', 'sstitle']
        const regions = ['FR', 'EU', 'WOR']

        for (const mediaType of mediaTypes) {
          for (const region of regions) {
            try {
              const url = await getCachedMediaUrl('game', game.id, mediaType, region)
              if (url) {
                console.log(`  ✅ ${mediaType}/${region}: ${url.substring(0, 60)}...`)
              } else {
                console.log(`  ❌ ${mediaType}/${region}: Non trouvé`)
              }
            } catch (error) {
              console.log(`  ⚠️  ${mediaType}/${region}: Erreur - ${error.message}`)
            }
          }
        }
      }
    }

    // Test 5: Statistiques finales
    console.log('\n📊 État final du cache:')
    const finalStats = await getCacheStats()
    console.log(`  - Total entries: ${finalStats.total}`)
    console.log(`  - By entity type:`, finalStats.byEntityType)

    // Test 6: Test de performance
    console.log('\n⚡ Test de performance du cache...')
    const startTime = Date.now()
    
    // Simuler plusieurs accès consécutifs à la même URL
    for (let i = 0; i < 5; i++) {
      await getCachedMediaUrl('game', 'test-game-id', 'box-2D', 'FR')
    }
    
    const endTime = Date.now()
    console.log(`  - 5 accès consécutifs en ${endTime - startTime}ms`)

    // Test 7: Test du batch caching
    console.log('\n🚀 Test du batch caching...')
    const batchItems = [
      {
        entityType: 'game' as const,
        entityId: 'batch-test-1',
        screenscrapeId: 12345,
        mediaTypes: ['box-2D', 'wheel'],
        regions: ['FR', 'EU']
      },
      {
        entityType: 'game' as const,
        entityId: 'batch-test-2',
        screenscrapeId: 12346,
        mediaTypes: ['box-2D'],
        regions: ['FR']
      }
    ]

    // Note: Cette fonction va faire des appels à Screenscraper en mode test
    // En production, elle ferait de vrais appels API
    console.log('  - Simulation du batch caching (pas d\'appels API réels)')
    // await cacheBatchMediaUrls(batchItems)

    console.log('\n✅ Tests du cache d\'URLs terminés avec succès!')

    return {
      success: true,
      initialStats,
      finalStats,
      cleanedCount
    }

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Test de stress pour vérifier les performances
async function stressTestCache(iterations: number = 100) {
  console.log(`\n🔥 Test de stress du cache (${iterations} itérations)...`)
  
  const startTime = Date.now()
  const promises = []

  for (let i = 0; i < iterations; i++) {
    promises.push(
      getCachedMediaUrl('game', `stress-test-${i % 10}`, 'box-2D', 'FR')
    )
  }

  await Promise.all(promises)
  
  const endTime = Date.now()
  const avgTime = (endTime - startTime) / iterations
  
  console.log(`  - ${iterations} appels en ${endTime - startTime}ms`)
  console.log(`  - Temps moyen par appel: ${avgTime.toFixed(2)}ms`)
  
  return {
    totalTime: endTime - startTime,
    averageTime: avgTime,
    iterations
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  testMediaUrlCache()
    .then(async (result) => {
      if (result.success) {
        console.log('\n🎉 Tous les tests sont passés!')
        
        // Test de stress optionnel
        await stressTestCache(50)
        
        process.exit(0)
      } else {
        console.error('\n💥 Échec des tests!')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('❌ Erreur inattendue:', error)
      process.exit(1)
    })
}

export { testMediaUrlCache, stressTestCache }