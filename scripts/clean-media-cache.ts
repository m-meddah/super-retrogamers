import { prisma } from '@/lib/prisma'

async function cleanMediaCache() {
  console.log('🧹 Nettoyage intelligent du cache des médias...\n')

  let totalDeleted = 0

  // 1. Supprimer les entrées de médias console sans région pour les mauvaises régions
  const regionlessMediaTypes = ['minicon', 'icon', 'video', 'video-normalized']
  
  const regionlessDeleted = await prisma.mediaUrlCache.deleteMany({
    where: {
      entityType: 'console',
      mediaType: { in: regionlessMediaTypes },
      region: { not: 'wor' }, // Ces médias ne devraient exister qu'en WOR
      OR: [{ url: '' }, { isValid: false }]
    }
  })

  console.log(`✅ Supprimé ${regionlessDeleted.count} entrées de médias console sans région (mauvaises régions)`)
  totalDeleted += regionlessDeleted.count

  // 2. Identifier et supprimer les entrées FR pour les consoles qui ne les supportent pas
  const supergrafx = await prisma.console.findFirst({
    where: { slug: 'pc-engine-supergrafx' },
    select: { id: true, name: true }
  })

  if (supergrafx) {
    // Supprimer les entrées FR pour la SuperGrafx console
    const consoleFrDeleted = await prisma.mediaUrlCache.deleteMany({
      where: {
        entityType: 'console',
        entityId: supergrafx.id,
        region: 'fr',
        OR: [{ url: '' }, { isValid: false }]
      }
    })

    console.log(`✅ Supprimé ${consoleFrDeleted.count} entrées FR pour console SuperGrafx`)
    totalDeleted += consoleFrDeleted.count

    // Supprimer les entrées FR pour les jeux SuperGrafx
    const supergrfxGames = await prisma.game.findMany({
      where: { consoleId: supergrafx.id },
      select: { id: true }
    })

    const gamesFrDeleted = await prisma.mediaUrlCache.deleteMany({
      where: {
        entityType: 'game',
        entityId: { in: supergrfxGames.map(g => g.id) },
        region: 'fr',
        OR: [{ url: '' }, { isValid: false }]
      }
    })

    console.log(`✅ Supprimé ${gamesFrDeleted.count} entrées FR pour jeux SuperGrafx`)
    totalDeleted += gamesFrDeleted.count
  }

  // 3. Supprimer toutes les autres entrées invalides/vides anciennes (plus de 1 jour)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  const invalidOldDeleted = await prisma.mediaUrlCache.deleteMany({
    where: {
      OR: [{ url: '' }, { isValid: false }],
      cachedAt: { lt: oneDayAgo }
    }
  })

  console.log(`✅ Supprimé ${invalidOldDeleted.count} entrées invalides anciennes (>24h)`)
  totalDeleted += invalidOldDeleted.count

  // 4. Statistiques finales
  const remainingTotal = await prisma.mediaUrlCache.count()
  const remainingInvalid = await prisma.mediaUrlCache.count({
    where: { OR: [{ url: '' }, { isValid: false }] }
  })

  console.log('\n📊 Résultats du nettoyage:')
  console.log(`🗑️  Total supprimé: ${totalDeleted} entrées`)
  console.log(`📦 Entrées restantes: ${remainingTotal}`)
  console.log(`⚠️  Entrées invalides restantes: ${remainingInvalid}`)

  if (remainingInvalid === 0) {
    console.log('🎉 Cache complètement nettoyé !')
  } else {
    console.log('⚠️  Quelques entrées invalides restantes (probablement récentes)')
  }
}

async function optimizeCache() {
  console.log('\n🔧 Optimisation du cache...')

  // Recréer les entrées manquées pour les médias sans région avec la bonne région (WOR)
  const regionlessMediaTypes = ['minicon', 'icon', 'video', 'video-normalized']
  
  // Trouver les consoles qui ont des médias regionless dans de mauvaises régions
  const consolesWithRegionlessIssues = await prisma.mediaUrlCache.groupBy({
    by: ['entityId'],
    where: {
      entityType: 'console',
      mediaType: { in: regionlessMediaTypes },
      region: { not: 'wor' }
    }
  })

  console.log(`🔄 ${consolesWithRegionlessIssues.length} consoles avec médias regionless à corriger`)

  for (const group of consolesWithRegionlessIssues) {
    // Vérifier si on a déjà les médias en WOR
    const hasWor = await prisma.mediaUrlCache.findFirst({
      where: {
        entityType: 'console',
        entityId: group.entityId,
        mediaType: { in: regionlessMediaTypes },
        region: 'wor',
        isValid: true
      }
    })

    if (!hasWor) {
      console.log(`⚠️  Console ${group.entityId} n'a pas de médias regionless en WOR`)
    }
  }

  console.log('✅ Optimisation terminée')
}

async function main() {
  try {
    await cleanMediaCache()
    await optimizeCache()
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()