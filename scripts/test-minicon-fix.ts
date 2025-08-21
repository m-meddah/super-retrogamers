import { clearCachedMediaUrls, getCachedMediaUrl } from '@/lib/media-url-cache'
import { prisma } from '@/lib/prisma'

async function testMiniconFix() {
  console.log('🧪 Test spécifique pour le média minicon (sans région)...\n')

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

  // Supprimer juste l'entrée minicon existante
  await prisma.mediaUrlCache.deleteMany({
    where: {
      entityType: 'console',
      entityId: neoGeo.id,
      mediaType: 'minicon'
    }
  })

  console.log('🗑️  Nettoyage des entrées minicon existantes...')

  // Test du minicon
  console.log('\n🔄 Test de récupération du média minicon...')

  try {
    const url = await getCachedMediaUrl('console', neoGeo.id, 'minicon', 'WOR')
    
    if (url) {
      console.log(`✅ URL minicon récupérée: ${url}`)
      
      // Vérifier l'entrée en cache
      const cacheEntry = await prisma.mediaUrlCache.findFirst({
        where: {
          entityType: 'console',
          entityId: neoGeo.id,
          mediaType: 'minicon'
        },
        select: {
          screenscrapeId: true,
          isValid: true,
          url: true,
          region: true
        }
      })

      console.log(`📦 Entrée en cache:`)
      console.log(`   Region: ${cacheEntry?.region}`)
      console.log(`   screenscrapeId: ${cacheEntry?.screenscrapeId}`)
      console.log(`   isValid: ${cacheEntry?.isValid}`)
      
      if (cacheEntry?.screenscrapeId === neoGeo.ssConsoleId && cacheEntry?.isValid) {
        console.log('🎉 Test réussi ! Le média minicon est correctement mis en cache.')
      } else {
        console.log('⚠️  Problème avec la mise en cache du minicon.')
      }
      
    } else {
      console.log(`❌ Aucune URL minicon trouvée`)
      
      // Vérifier si l'échec a été mis en cache avec le bon screenscrapeId
      const cacheEntry = await prisma.mediaUrlCache.findFirst({
        where: {
          entityType: 'console',
          entityId: neoGeo.id,
          mediaType: 'minicon'
        },
        select: {
          screenscrapeId: true,
          isValid: true,
          url: true
        }
      })

      if (cacheEntry && cacheEntry.screenscrapeId === neoGeo.ssConsoleId) {
        console.log('✅ Échec correctement mis en cache avec le bon screenscrapeId')
      } else {
        console.log('❌ Problème avec la mise en cache de l\'échec')
      }
    }
    
  } catch (error) {
    console.error(`❌ Erreur pour minicon:`, error)
  }
}

async function main() {
  try {
    await testMiniconFix()
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()