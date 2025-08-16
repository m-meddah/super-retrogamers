#!/usr/bin/env npx tsx

/**
 * Script pour migrer les données existantes vers les nouveaux modèles
 * Usage: npx tsx scripts/migrate-existing-data.ts
 */

import { prisma } from '../lib/prisma'

async function main() {
  console.log('🚀 Démarrage de la migration des données existantes...')
  
  try {
    // 1. Créer les corporations à partir des developers/publishers existants
    console.log('📊 Migration des corporations...')
    
    // Récupérer tous les developers et publishers uniques
    const developersResult = await prisma.game.findMany({
      where: { developer: { not: null } },
      select: { developer: true },
      distinct: ['developer']
    })
    
    const publishersResult = await prisma.game.findMany({
      where: { publisher: { not: null } },
      select: { publisher: true },
      distinct: ['publisher']
    })
    
    // Combiner et dédupliquer
    const companies = new Set<string>()
    developersResult.forEach(d => d.developer && companies.add(d.developer))
    publishersResult.forEach(p => p.publisher && companies.add(p.publisher))
    
    console.log(`  → ${companies.size} entreprises uniques trouvées`)
    
    // Créer les corporations
    for (const companyName of companies) {
      await prisma.corporation.upsert({
        where: { name: companyName },
        update: {},
        create: {
          name: companyName,
          description: {},
          anecdotes: []
        }
      })
    }
    
    console.log(`  ✅ ${companies.size} corporations créées`)
    
    // 2. Créer les types de jeux à partir des genres existants
    console.log('🎯 Migration des types de jeux...')
    
    const genresResult = await prisma.game.findMany({
      where: { genre: { not: null } },
      select: { genre: true },
      distinct: ['genre']
    })
    
    console.log(`  → ${genresResult.length} genres uniques trouvés`)
    
    for (const genreItem of genresResult) {
      if (genreItem.genre) {
        await prisma.gameType.upsert({
          where: { name: genreItem.genre },
          update: {},
          create: {
            name: genreItem.genre,
            nameEn: genreItem.genre, // On garde le même nom pour l'instant
            description: `Type de jeu: ${genreItem.genre}`
          }
        })
      }
    }
    
    console.log(`  ✅ ${genresResult.length} types de jeux créés`)
    
    // 3. Lier les jeux aux nouvelles corporations (developers)
    console.log('🔗 Liaison des jeux aux developers...')
    
    const gamesWithDev = await prisma.game.findMany({
      where: { 
        developer: { not: null },
        corporationDevId: null
      },
      select: { id: true, developer: true }
    })
    
    for (const game of gamesWithDev) {
      if (game.developer) {
        const corporation = await prisma.corporation.findUnique({
          where: { name: game.developer }
        })
        
        if (corporation) {
          await prisma.game.update({
            where: { id: game.id },
            data: { corporationDevId: corporation.id }
          })
        }
      }
    }
    
    console.log(`  ✅ ${gamesWithDev.length} jeux liés aux developers`)
    
    // 4. Lier les jeux aux nouvelles corporations (publishers)
    console.log('🔗 Liaison des jeux aux publishers...')
    
    const gamesWithPub = await prisma.game.findMany({
      where: { 
        publisher: { not: null },
        corporationPubId: null
      },
      select: { id: true, publisher: true }
    })
    
    for (const game of gamesWithPub) {
      if (game.publisher) {
        const corporation = await prisma.corporation.findUnique({
          where: { name: game.publisher }
        })
        
        if (corporation) {
          await prisma.game.update({
            where: { id: game.id },
            data: { corporationPubId: corporation.id }
          })
        }
      }
    }
    
    console.log(`  ✅ ${gamesWithPub.length} jeux liés aux publishers`)
    
    // 5. Lier les jeux aux nouveaux types
    console.log('🔗 Liaison des jeux aux types...')
    
    const gamesWithGenre = await prisma.game.findMany({
      where: { 
        genre: { not: null },
        gameTypeId: null
      },
      select: { id: true, genre: true }
    })
    
    for (const game of gamesWithGenre) {
      if (game.genre) {
        const gameType = await prisma.gameType.findUnique({
          where: { name: game.genre }
        })
        
        if (gameType) {
          await prisma.game.update({
            where: { id: game.id },
            data: { gameTypeId: gameType.id }
          })
        }
      }
    }
    
    console.log(`  ✅ ${gamesWithGenre.length} jeux liés aux types`)
    
    // 6. Créer quelques générations de base
    console.log('🎮 Création des générations de consoles...')
    
    const generations = [
      { name: '1ère génération', nameEn: '1st generation', startYear: 1972, endYear: 1977 },
      { name: '2ème génération', nameEn: '2nd generation', startYear: 1976, endYear: 1992 },
      { name: '3ème génération', nameEn: '3rd generation', startYear: 1983, endYear: 2003 },
      { name: '4ème génération', nameEn: '4th generation', startYear: 1987, endYear: 2004 },
      { name: '5ème génération', nameEn: '5th generation', startYear: 1993, endYear: 2005 },
      { name: '6ème génération', nameEn: '6th generation', startYear: 1998, endYear: 2013 },
      { name: '7ème génération', nameEn: '7th generation', startYear: 2005, endYear: 2017 },
      { name: '8ème génération', nameEn: '8th generation', startYear: 2012, endYear: 2020 },
      { name: '9ème génération', nameEn: '9th generation', startYear: 2020, endYear: null }
    ]
    
    for (const gen of generations) {
      await prisma.generation.upsert({
        where: { name: gen.name },
        update: {},
        create: gen
      })
    }
    
    console.log(`  ✅ ${generations.length} générations créées`)
    
    console.log('✨ Migration des données terminée avec succès')
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  }
}

main()
  .then(() => {
    console.log('🎉 Migration terminée avec succès')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })