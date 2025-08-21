import { prisma } from '@/lib/prisma'

async function analyzeMediaCache() {
  console.log('🔍 Analyse du cache des médias...\n')

  // Compter toutes les entrées
  const total = await prisma.mediaUrlCache.count()
  console.log(`📊 Total des entrées en cache: ${total}`)

  // Compter les entrées avec URL vide ou invalides
  const nullEntries = await prisma.mediaUrlCache.count({
    where: {
      OR: [
        { url: '' },
        { isValid: false }
      ]
    }
  })
  console.log(`❌ Entrées avec URL null/vide: ${nullEntries}`)

  // Détails des entrées problématiques
  const problematicEntries = await prisma.mediaUrlCache.findMany({
    where: {
      OR: [
        { url: '' },
        { isValid: false }
      ]
    },
    select: {
      entityType: true,
      entityId: true,
      mediaType: true,
      region: true,
      url: true,
      isValid: true
    }
  })

  console.log('\n📋 Détail des entrées problématiques:')
  for (const entry of problematicEntries) {
    console.log(`  - ${entry.entityType}(${entry.entityId}): ${entry.mediaType}(${entry.region.toUpperCase()}) - isValid: ${entry.isValid} - url: "${entry.url}"`)
  }

  // Analyser les médias console par type
  const consoleMediaTypes = await prisma.mediaUrlCache.groupBy({
    by: ['mediaType'],
    where: { entityType: 'console' },
    _count: { id: true }
  })

  console.log('\n🎮 Types de médias console en cache:')
  for (const type of consoleMediaTypes) {
    const nullCount = await prisma.mediaUrlCache.count({
      where: {
        entityType: 'console',
        mediaType: type.mediaType,
        OR: [{ url: '' }, { isValid: false }]
      }
    })
    console.log(`  - ${type.mediaType}: ${type._count.id} total (${nullCount} null)`)
  }

  // Analyser les régions problématiques pour les jeux SuperGrafx
  const supergrafx = await prisma.console.findFirst({
    where: { slug: 'pc-engine-supergrafx' },
    select: { id: true, name: true }
  })

  if (supergrafx) {
    const supergrfxGames = await prisma.game.findMany({
      where: { consoleId: supergrafx.id },
      select: { id: true, title: true }
    })

    console.log(`\n🎯 Jeux SuperGrafx (${supergrfxGames.length} jeux):`)
    for (const game of supergrfxGames) {
      const gameCache = await prisma.mediaUrlCache.findMany({
        where: {
          entityType: 'game',
          entityId: game.id,
          OR: [{ url: '' }, { isValid: false }]
        }
      })
      if (gameCache.length > 0) {
        console.log(`  - ${game.title}: ${gameCache.length} entrées null/vide`)
        for (const cache of gameCache) {
          console.log(`    * ${cache.mediaType}(${cache.region.toUpperCase()})`)
        }
      }
    }
  }

  // Statistiques par région
  const regionStats = await prisma.mediaUrlCache.groupBy({
    by: ['region'],
    _count: { id: true }
  })

  console.log('\n🌍 Statistiques par région:')
  for (const stat of regionStats) {
    const nullCount = await prisma.mediaUrlCache.count({
      where: {
        region: stat.region,
        OR: [{ url: '' }, { isValid: false }]
      }
    })
    console.log(`  - ${stat.region.toUpperCase()}: ${stat._count.id} total (${nullCount} null)`)
  }
}

// Fonction de nettoyage intelligente
async function cleanProblematicCache() {
  console.log('\n🧹 Nettoyage des entrées problématiques...')

  // 1. Supprimer les entrées avec URL null/vide pour les médias sans région (minicon, icon, video, etc.)
  const regionlessMediaTypes = ['minicon', 'icon', 'video', 'video-normalized']
  
  const regionlessDeleted = await prisma.mediaUrlCache.deleteMany({
    where: {
      entityType: 'console',
      mediaType: { in: regionlessMediaTypes },
      region: { not: 'wor' }, // Garder seulement WOR pour ces types
      OR: [{ url: '' }, { isValid: false }]
    }
  })

  console.log(`✅ Supprimé ${regionlessDeleted.count} entrées de médias console sans région`)

  // 2. Supprimer les entrées FR pour les consoles qui n'ont pas de région FR
  const consolesWithoutFR = await prisma.console.findMany({
    where: {
      NOT: {
        mediaUrlCache: {
          some: {
            region: 'fr',
            url: { not: '' },
            url: { not: null }
          }
        }
      }
    },
    select: { id: true }
  })

  const frDeleted = await prisma.mediaUrlCache.deleteMany({
    where: {
      entityType: 'console',
      region: 'fr',
      entityId: { in: consolesWithoutFR.map(c => c.id) },
      OR: [{ url: '' }, { isValid: false }]
    }
  })

  console.log(`✅ Supprimé ${frDeleted.count} entrées FR pour consoles sans support FR`)

  // 3. Supprimer les entrées FR pour les jeux de consoles sans région FR
  const gamesFrDeleted = await prisma.mediaUrlCache.deleteMany({
    where: {
      entityType: 'game',
      region: 'fr',
      OR: [{ url: '' }, { isValid: false }]
    }
  })

  console.log(`✅ Supprimé ${gamesFrDeleted.count} entrées FR pour jeux`)

  console.log('\n✨ Nettoyage terminé !')
}

async function main() {
  try {
    await analyzeMediaCache()
    
    console.log('\n❓ Voulez-vous nettoyer les entrées problématiques ? (y/N)')
    // Pour ce script, on va juste analyser pour l'instant
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()