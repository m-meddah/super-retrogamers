#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateGameRegionalDates() {
  console.log('🔄 Starting migration of game release dates to regional dates table...')

  try {
    // Récupérer tous les jeux avec des dates de sortie
    const gamesWithDates = await prisma.game.findMany({
      where: {
        OR: [
          { releaseDateFR: { not: null } },
          { releaseDateEU: { not: null } },
          { releaseDateWOR: { not: null } },
          { releaseDateJP: { not: null } },
          { releaseDateUS: { not: null } }
        ]
      },
      select: {
        id: true,
        title: true,
        releaseDateFR: true,
        releaseDateEU: true,
        releaseDateWOR: true,
        releaseDateJP: true,
        releaseDateUS: true
      }
    })

    console.log(`📊 Found ${gamesWithDates.length} games with release dates`)

    let migratedCount = 0
    let totalDatesCreated = 0

    for (const game of gamesWithDates) {
      console.log(`\n🎮 Processing game: ${game.title}`)

      const datesToMigrate = [
        { region: 'FR' as const, date: game.releaseDateFR },
        { region: 'EU' as const, date: game.releaseDateEU },
        { region: 'WOR' as const, date: game.releaseDateWOR },
        { region: 'JP' as const, date: game.releaseDateJP },
        { region: 'US' as const, date: game.releaseDateUS }
      ]

      let gameUpdated = false

      for (const { region, date } of datesToMigrate) {
        if (date) {
          // Vérifier si l'entrée existe déjà
          const existingEntry = await prisma.gameRegionalDate.findUnique({
            where: {
              gameId_region: {
                gameId: game.id,
                region: region
              }
            }
          })

          if (!existingEntry) {
            await prisma.gameRegionalDate.create({
              data: {
                gameId: game.id,
                region: region,
                releaseDate: date
              }
            })
            console.log(`  ✅ Created ${region} release date: ${date.toLocaleDateString('fr-FR')}`)
            totalDatesCreated++
            gameUpdated = true
          } else {
            console.log(`  ⚠️  ${region} release date already exists, skipping`)
          }
        }
      }

      if (gameUpdated) {
        migratedCount++
      }
    }

    console.log(`\n🎯 Migration completed:`)
    console.log(`  - ${migratedCount} games processed`)
    console.log(`  - ${totalDatesCreated} regional dates created`)

    // Vérifier le résultat
    const totalRegionalDates = await prisma.gameRegionalDate.count()
    console.log(`  - Total regional dates in database: ${totalRegionalDates}`)

    return {
      success: true,
      gamesProcessed: migratedCount,
      datesCreated: totalDatesCreated,
      totalRegionalDates
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  migrateGameRegionalDates()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ Migration completed successfully!')
        process.exit(0)
      } else {
        console.error('\n❌ Migration failed!')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('❌ Unexpected error:', error)
      process.exit(1)
    })
}

export { migrateGameRegionalDates }