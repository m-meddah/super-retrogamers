#!/usr/bin/env tsx

import { createGameFromScreenscraper } from '../lib/screenscraper-games'
import { prisma } from '../lib/prisma'

async function testGameScraping() {
  try {
    console.log('🎮 Test du scraping avancé de jeux...')
    
    // Test avec un autre jeu de Megadrive
    const gameId = 2 // Un autre jeu sur Megadrive
    const systemId = 1 // Megadrive
    
    // Trouver la console Megadrive dans la base
    const megadriveConsole = await prisma.console.findFirst({
      where: { screenscrapeId: systemId }
    })
    
    if (!megadriveConsole) {
      console.log('❌ Console Megadrive non trouvée dans la base. Scrapez d\'abord les consoles.')
      return
    }
    
    console.log(`✅ Console trouvée: ${megadriveConsole.name}`)
    
    // Construire l'URL de l'API Screenscraper
    const devId = process.env.SCREENSCRAPER_DEV_ID
    const devPassword = process.env.SCREENSCRAPER_DEV_PASSWORD
    
    if (!devId || !devPassword) {
      console.log('❌ Identifiants Screenscraper manquants dans .env')
      return
    }
    
    const url = `https://api.screenscraper.fr/api2/jeuInfos.php?devid=${devId}&devpassword=${devPassword}&output=json&gameid=${gameId}&systemeid=${systemId}`
    
    console.log(`🔍 Récupération des données du jeu ${gameId}...`)
    const response = await fetch(url)
    
    if (!response.ok) {
      console.log(`❌ Erreur API: ${response.status}`)
      return
    }
    
    const data = await response.json()
    const gameDetails = data.response?.jeu
    
    if (!gameDetails) {
      console.log('❌ Jeu non trouvé dans Screenscraper')
      return
    }
    
    // Helper function to extract string from object or string
    const extractString = (value: any): string => {
      if (!value) return 'N/A'
      if (typeof value === 'string') return value
      if (typeof value === 'number') return String(value)
      if (typeof value === 'object') {
        return value.text || value.nom || value.name || value.value || value[Object.keys(value)[0]] || 'N/A'
      }
      return String(value)
    }
    
    console.log(`📋 Données récupérées pour: ${gameDetails.noms?.nom_eu || gameDetails.noms?.nom_us || 'Jeu sans nom'}`)
    console.log(`   - Développeur: ${extractString(gameDetails.developpeur)}`)
    console.log(`   - Éditeur: ${extractString(gameDetails.editeur)}`)
    console.log(`   - Note: ${extractString(gameDetails.note)}/20`)
    console.log(`   - Nombre de joueurs: ${extractString(gameDetails.joueurs)}`)
    console.log(`   - Genres disponibles: ${gameDetails.genres?.genres_fr?.join(', ') || 'N/A'}`)
    console.log(`   - TOP Staff: ${gameDetails.topstaff ? 'Oui' : 'Non'}`)
    console.log(`   - Médias disponibles: ${gameDetails.medias ? Object.keys(gameDetails.medias).length : 0} types`)
    
    // Debug: examine actual media structure
    if (gameDetails.medias && Object.keys(gameDetails.medias).length > 0) {
      console.log(`   - Premier média exemple:`, JSON.stringify(gameDetails.medias[0] || gameDetails.medias[Object.keys(gameDetails.medias)[0]], null, 2).substring(0, 500))
    }
    
    // Tester la création en base
    console.log('💾 Test de création en base de données...')
    
    // Vérifier si le jeu existe déjà
    const existingGame = await prisma.game.findFirst({
      where: { 
        screenscrapeId: gameId,
        consoleId: megadriveConsole.id
      },
      include: {
        genres: true
      }
    })
    
    if (existingGame) {
      console.log(`⚠️  Jeu déjà existant: ${existingGame.title}`)
      console.log(`   - Slug: ${existingGame.slug}`)
      console.log(`   - Genres en base: ${existingGame.genres.length}`)
      
      // Supprimer le jeu existant pour le test
      console.log('🗑️  Suppression du jeu existant pour le test...')
      await prisma.game.delete({ where: { id: existingGame.id } })
    }
    
    // Créer le jeu avec la fonction améliorée
    const createdGame = await createGameFromScreenscraper(gameDetails, megadriveConsole)
    
    if (createdGame) {
      console.log('✅ Jeu créé avec succès!')
      console.log(`   - ID: ${createdGame.id}`)
      console.log(`   - Titre: ${createdGame.title}`)
      console.log(`   - Slug: ${createdGame.slug}`)
      console.log(`   - Note: ${createdGame.rating}/20`)
      console.log(`   - TOP Staff: ${createdGame.topStaff ? 'Oui' : 'Non'}`)
      console.log(`   - Joueurs: ${createdGame.playerCount || 'N/A'}`)
      console.log(`   - Flags: Demo=${createdGame.isDemo}, Beta=${createdGame.isBeta}, Best=${createdGame.isBestVersion}`)
      
      // Vérifier les genres et médias créés
      const gameWithDetails = await prisma.game.findUnique({
        where: { id: createdGame.id },
        include: { 
          genres: true,
          medias: true
        }
      })
      
      console.log(`   - Genres en base: ${gameWithDetails?.genres.length || 0}`)
      if (gameWithDetails?.genres.length) {
        gameWithDetails.genres.forEach(genre => {
          console.log(`     • ${genre.genreName} (ID: ${genre.genreId}, Principal: ${genre.isPrimary})`)
        })
      }
      
      console.log(`   - Médias en base: ${gameWithDetails?.medias.length || 0}`)
      if (gameWithDetails?.medias.length) {
        gameWithDetails.medias.forEach(media => {
          console.log(`     • ${media.mediaType} (${media.region}) - ${media.localPath || 'téléchargement échoué'}`)
        })
      }
    } else {
      console.log('❌ Échec de la création du jeu')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testGameScraping()