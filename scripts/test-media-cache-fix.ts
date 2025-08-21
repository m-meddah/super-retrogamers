import { clearCachedMediaUrls, getCachedMediaUrl } from '@/lib/media-url-cache'
import { prisma } from '@/lib/prisma'

async function testMediaCacheFix() {
  console.log('🧪 Test du système de cache corrigé...\n')

  // Trouver la console Neo Geo
  const neoGeo = await prisma.console.findFirst({
    where: { slug: 'neo-geo' },
    select: { id: true, name: true, ssConsoleId: true }
  })

  if (!neoGeo) {
    console.log('❌ Console Neo Geo non trouvée')
    return
  }

  console.log(`🎮 Test avec console: ${neoGeo.name} (ssConsoleId: ${neoGeo.ssConsoleId})`)

  // Supprimer le cache existant pour cette console
  console.log('🗑️  Nettoyage du cache existant...')
  await clearCachedMediaUrls('console', neoGeo.id)

  // Vérifier que le cache est vide
  const cacheCount = await prisma.mediaUrlCache.count({
    where: {
      entityType: 'console',
      entityId: neoGeo.id
    }
  })

  console.log(`📊 Entrées en cache après nettoyage: ${cacheCount}`)

  // Tester quelques appels de cache
  console.log('\n🔄 Test de récupération de médias...')

  const testCases = [
    { mediaType: 'wheel', region: 'WOR' },
    { mediaType: 'logo-svg', region: 'WOR' },
    { mediaType: 'minicon', region: 'WOR' } // Ce média devrait fonctionner
  ]

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.mediaType}(${testCase.region})`)
    
    try {
      const url = await getCachedMediaUrl('console', neoGeo.id, testCase.mediaType, testCase.region)
      
      if (url) {
        console.log(`✅ URL récupérée: ${url.substring(0, 60)}...`)
        
        // Vérifier l'entrée en cache
        const cacheEntry = await prisma.mediaUrlCache.findFirst({
          where: {
            entityType: 'console',
            entityId: neoGeo.id,
            mediaType: testCase.mediaType,
            region: testCase.region.toLowerCase()
          },
          select: {
            screenscrapeId: true,
            isValid: true,
            url: true
          }
        })

        if (cacheEntry) {
          console.log(`📦 Cache: screenscrapeId=${cacheEntry.screenscrapeId}, isValid=${cacheEntry.isValid}`)
        }
      } else {
        console.log(`❌ Aucune URL trouvée`)
      }
      
      // Pause pour respecter le rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500))
      
    } catch (error) {
      console.error(`❌ Erreur pour ${testCase.mediaType}:`, error)
    }
  }

  // Statistiques finales
  const finalCacheCount = await prisma.mediaUrlCache.count({
    where: {
      entityType: 'console',
      entityId: neoGeo.id
    }
  })

  const validEntries = await prisma.mediaUrlCache.count({
    where: {
      entityType: 'console',
      entityId: neoGeo.id,
      screenscrapeId: neoGeo.ssConsoleId
    }
  })

  console.log(`\n📊 Statistiques finales:`)
  console.log(`   Nouvelles entrées en cache: ${finalCacheCount}`)
  console.log(`   Entrées avec bon screenscrapeId: ${validEntries}`)
  
  if (validEntries === finalCacheCount && finalCacheCount > 0) {
    console.log('🎉 Test réussi ! Le système de cache fonctionne correctement.')
  } else {
    console.log('⚠️  Il y a encore des problèmes avec le système de cache.')
  }
}

async function main() {
  try {
    await testMediaCacheFix()
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()