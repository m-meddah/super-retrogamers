#!/usr/bin/env tsx

/**
 * Script de préparation au re-scraping complet
 * 1. Synchronise les genres en premier (OBLIGATOIRE)
 * 2. Remplit la table generations
 * 3. Prépare l'environnement pour le re-scraping
 */

import { PrismaClient } from '@prisma/client'
import { scrapeGenresFromScreenscraper } from '@/lib/screenscraper-genres'
import { populateGenerations } from './populate-generations'

const prisma = new PrismaClient()

async function syncGenresFirst() {
  console.log('\n🏷️  === SYNCHRONISATION DES GENRES (ÉTAPE CRITIQUE) ===')
  console.log('⚠️  Cette étape est OBLIGATOIRE avant le re-scraping des jeux!')
  
  try {
    console.log('🔄 Récupération de tous les genres depuis Screenscraper...')
    
    const result = await scrapeGenresFromScreenscraper()
    
    if (result.success) {
      console.log(`✅ SUCCÈS:`)
      console.log(`   - ${result.genresCreated} genres créés`)
      console.log(`   - ${result.genresUpdated} genres mis à jour`) 
      console.log(`   - ${result.totalGenres} genres au total dans la base`)
      
      // Vérifier que nous avons bien des genres
      const genreCount = await prisma.genre.count()
      if (genreCount === 0) {
        throw new Error('Aucun genre dans la base après synchronisation!')
      }
      
      console.log(`📊 Vérification: ${genreCount} genres disponibles`)
      return true
      
    } else {
      console.error(`❌ ÉCHEC de la synchronisation des genres:`, result.error)
      return false
    }
    
  } catch (error) {
    console.error('💥 ERREUR CRITIQUE lors de la synchronisation des genres:', error)
    return false
  }
}

async function prepareGenerations() {
  console.log('\n📅 === PRÉPARATION DES GÉNÉRATIONS ===')
  
  try {
    await populateGenerations()
    
    const generationCount = await prisma.generation.count()
    console.log(`✅ ${generationCount} générations disponibles`)
    return true
    
  } catch (error) {
    console.error('💥 ERREUR lors de la préparation des générations:', error)
    return false
  }
}

async function checkPrerequisites() {
  console.log('\n🔍 === VÉRIFICATION DES PRÉREQUIS ===')
  
  // Vérifier les variables d'environnement Screenscraper
  const devId = process.env.SCREENSCRAPER_DEV_ID
  const devPassword = process.env.SCREENSCRAPER_DEV_PASSWORD
  
  if (!devId || !devPassword) {
    console.error('❌ Variables d\'environnement Screenscraper manquantes:')
    console.error('   SCREENSCRAPER_DEV_ID et SCREENSCRAPER_DEV_PASSWORD requis')
    return false
  }
  
  console.log(`✅ Credentials Screenscraper configurés (Dev ID: ${devId})`)
  
  // Vérifier la connectivité à la base
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Connexion à la base de données OK')
  } catch (error) {
    console.error('❌ Erreur de connexion à la base:', error)
    return false
  }
  
  // Compter les données existantes
  const [consoles, games, families, corps] = await Promise.all([
    prisma.console.count({ where: { ssConsoleId: { not: null } } }),
    prisma.game.count({ where: { ssGameId: { not: null } } }),
    prisma.family.count(),
    prisma.corporation.count()
  ])
  
  console.log(`📊 Données existantes à re-scraper:`)
  console.log(`   - ${consoles} consoles avec ID Screenscraper`)
  console.log(`   - ${games} jeux avec ID Screenscraper`)
  console.log(`   - ${families} familles`)
  console.log(`   - ${corps} corporations`)
  
  if (consoles === 0 && games === 0) {
    console.warn('⚠️  Aucune donnée avec IDs Screenscraper trouvée')
    console.warn('   Le re-scraping ne trouvera rien à traiter')
  }
  
  return true
}

async function displayInstructions() {
  console.log('\n📋 === INSTRUCTIONS DE RE-SCRAPING ===')
  console.log(`
🔄 ÉTAPES RECOMMANDÉES:

1. ✅ Genres synchronisés (déjà fait)
2. ✅ Générations préparées (déjà fait)  
3. 🔄 Lancer le test de re-scraping:
   npx tsx scripts/test-rescraping.ts

4. 🚀 Si le test réussit, lancer le re-scraping complet:
   npx tsx scripts/rescrape-all-data.ts

⚠️  IMPORTANT:
- Le re-scraping peut prendre PLUSIEURS HEURES selon la quantité de données
- Respecte automatiquement les limites API (1.2s entre requêtes)
- Traite par lots de 10 éléments avec pauses
- Vous pouvez interrompre avec Ctrl+C à tout moment

💡 SURVEILLANCE:
- Surveillez les logs pour détecter les erreurs
- Le script affiche des statistiques régulières
- En cas d'interruption, relancez le script (il ignore les déjà traités)
  `)
}

async function main() {
  const startTime = Date.now()
  console.log('🎯 PRÉPARATION AU RE-SCRAPING COMPLET')
  console.log(`⏰ Démarré à: ${new Date().toLocaleString('fr-FR')}`)
  
  try {
    // 1. Vérifier les prérequis
    console.log('\n='.repeat(60))
    const prerequisites = await checkPrerequisites()
    if (!prerequisites) {
      console.error('\n❌ PRÉREQUIS NON SATISFAITS - Abandon')
      process.exit(1)
    }
    
    // 2. Synchroniser les genres EN PREMIER (critique!)
    console.log('\n='.repeat(60))
    const genresOk = await syncGenresFirst()
    if (!genresOk) {
      console.error('\n❌ SYNCHRONISATION DES GENRES ÉCHOUÉE - Abandon')
      console.error('   Le re-scraping des jeux ne peut pas fonctionner sans genres')
      process.exit(1)
    }
    
    // 3. Préparer les générations
    console.log('\n='.repeat(60))
    const generationsOk = await prepareGenerations()
    if (!generationsOk) {
      console.warn('\n⚠️  Générations non préparées (non critique)')
    }
    
    // 4. Afficher les instructions
    console.log('\n='.repeat(60))
    await displayInstructions()
    
    const duration = Math.round((Date.now() - startTime) / 1000)
    console.log(`\n✅ PRÉPARATION TERMINÉE EN ${duration}s`)
    console.log('🚀 Prêt pour le re-scraping!')
    
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

export { main as prepareRescraping }