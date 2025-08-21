import { prisma } from '@/lib/prisma'

async function simulateAnniversaryToday() {
  console.log('🎂 Simulation d\'un anniversaire aujourd\'hui pour test...\n')

  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth() + 1

  console.log(`📅 Aujourd'hui: ${currentDay}/${currentMonth}`)

  // Trouver un jeu à modifier temporairement
  const gameToModify = await prisma.gameRegionalDate.findFirst({
    where: {
      releaseDate: { not: null }
    },
    include: {
      game: {
        select: {
          title: true
        }
      }
    }
  })

  if (!gameToModify) {
    console.log('❌ Aucun jeu avec date trouvé')
    return
  }

  console.log(`🎮 Jeu sélectionné: ${gameToModify.game.title}`)
  console.log(`📅 Date actuelle: ${gameToModify.releaseDate ? new Date(gameToModify.releaseDate).toLocaleDateString('fr-FR') : 'null'}`)

  // Sauvegarder l'ancienne date
  const originalDate = gameToModify.releaseDate

  if (originalDate) {
    // Créer une nouvelle date avec le jour/mois d'aujourd'hui mais l'année originale
    const originalYear = new Date(originalDate).getFullYear()
    const newDate = new Date(originalYear, currentMonth - 1, currentDay)

    console.log(`🔄 Modification temporaire vers: ${newDate.toLocaleDateString('fr-FR')}`)

    // Modifier temporairement la date
    await prisma.gameRegionalDate.update({
      where: {
        id: gameToModify.id
      },
      data: {
        releaseDate: newDate
      }
    })

    console.log('✅ Date modifiée temporairement')
    console.log('\n🔔 Maintenant vous pouvez tester la homepage sur http://localhost:3001')
    console.log('   Le jeu devrait apparaître dans la section anniversaires !')
    
    console.log('\n⚠️  IMPORTANT: N\'oubliez pas de restaurer la date originale après le test')
    console.log(`   Commande: npx tsx scripts/restore-anniversary-date.ts "${gameToModify.id}" "${originalDate.toISOString()}"`)
    
    // Créer le script de restauration
    const restoreScript = `import { prisma } from '@/lib/prisma'

async function restoreDate() {
  await prisma.gameRegionalDate.update({
    where: { id: '${gameToModify.id}' },
    data: { releaseDate: new Date('${originalDate.toISOString()}') }
  })
  console.log('✅ Date restaurée')
  await prisma.$disconnect()
}

restoreDate()`

    await require('fs').promises.writeFile('scripts/restore-anniversary-date.ts', restoreScript)
    console.log('📝 Script de restauration créé: scripts/restore-anniversary-date.ts')

  } else {
    console.log('❌ Impossible de modifier: pas de date originale')
  }
}

async function main() {
  try {
    await simulateAnniversaryToday()
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()