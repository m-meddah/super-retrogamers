#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function analyzeDeveloperPublisherColumns() {
  console.log('🔍 Analyse des colonnes developer/publisher dans la table games...\n')

  try {
    // Compter les jeux avec des données dans chaque colonne (nouvelles relations)
    const stats = {
      totalGames: await prisma.game.count(),
      withCorporationDevId: await prisma.game.count({ where: { corporationDevId: { not: null } } }),
      withCorporationPubId: await prisma.game.count({ where: { corporationPubId: { not: null } } })
    }

    console.log('📊 Statistiques générales:')
    console.log(`  - Total games: ${stats.totalGames}`)
    console.log(`  - Avec corporationDevId: ${stats.withCorporationDevId}`)
    console.log(`  - Avec corporationPubId: ${stats.withCorporationPubId}`)

    // Échantillon de données pour voir les nouvelles relations
    console.log('\n📋 Échantillon de données (10 premiers jeux avec corporation):')
    const sampleGames = await prisma.game.findMany({
      where: { 
        OR: [
          { corporationDevId: { not: null } },
          { corporationPubId: { not: null } }
        ]
      },
      select: {
        title: true,
        corporationDevId: true,
        corporationPubId: true,
        corporationDev: {
          select: { name: true }
        },
        corporationPub: {
          select: { name: true }
        }
      },
      take: 10
    })

    sampleGames.forEach((game, index) => {
      console.log(`\n${index + 1}. ${game.title}`)
      if (game.corporationDevId) console.log(`   corporationDevId: "${game.corporationDevId}"`)
      if (game.corporationPubId) console.log(`   corporationPubId: "${game.corporationPubId}"`)
      if (game.corporationDev?.name) console.log(`   développeur: "${game.corporationDev.name}"`)
      if (game.corporationPub?.name) console.log(`   éditeur: "${game.corporationPub.name}"`)
    })

    // Vérifier les corporations uniques utilisées comme développeurs
    const uniqueCorpDevs = await prisma.corporation.findMany({
      where: {
        developedGames: {
          some: {}
        }
      },
      select: {
        name: true,
        _count: {
          select: {
            developedGames: true
          }
        }
      }
    })

    console.log(`\n🎯 Corporations développeurs: ${uniqueCorpDevs.length}`)
    if (uniqueCorpDevs.length <= 20) {
      uniqueCorpDevs.forEach(corp => {
        console.log(`  - "${corp.name}" (${corp._count.developedGames} jeux)`)
      })
    } else {
      console.log('  Top 10:')
      uniqueCorpDevs
        .sort((a, b) => b._count.developedGames - a._count.developedGames)
        .slice(0, 10)
        .forEach(corp => {
          console.log(`  - "${corp.name}" (${corp._count.developedGames} jeux)`)
        })
    }

    // Vérifier les corporations existantes
    const corporationCount = await prisma.corporation.count()
    console.log(`\n🏢 Corporations dans la base: ${corporationCount}`)

    if (corporationCount > 0) {
      const corporations = await prisma.corporation.findMany({
        select: { id: true, name: true, ssCorporationId: true },
        take: 10
      })
      
      console.log('Échantillon:')
      corporations.forEach(corp => {
        console.log(`  - ${corp.name} (ID: ${corp.id}, SS ID: ${corp.ssCorporationId})`)
      })
    }

    return {
      success: true,
      stats,
      uniqueCorpDevsCount: uniqueCorpDevs.length,
      corporationCount
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter l'analyse si le script est appelé directement
if (require.main === module) {
  analyzeDeveloperPublisherColumns()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ Analyse terminée!')
        process.exit(0)
      } else {
        console.error('\n❌ Analyse échouée!')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('❌ Erreur inattendue:', error)
      process.exit(1)
    })
}

export { analyzeDeveloperPublisherColumns }