'use server'

import { prisma } from '@/lib/prisma'

// Rate limiting: 1.2 secondes entre les requêtes (même délai que pour les autres endpoints)
const RATE_LIMIT_MS = 1200

async function rateLimitedFetch(url: string): Promise<Response> {
  await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS))
  return fetch(url)
}

interface ScreenscraperGenre {
  id: number
  nom_fr?: string
  nom_de?: string
  nom_en?: string
  nom_es?: string
  nom_it?: string
  nom_pt?: string
  parent: string
  medias?: {
    media_pictomonochrome?: string
  }
}

interface ScreenscraperGenresResponse {
  response: {
    genres: Record<string, ScreenscraperGenre>
  }
}

export async function scrapeGenresFromScreenscraper(): Promise<{ success: boolean, count: number, message: string }> {
  const devId = process.env.SCREENSCRAPER_DEV_ID
  const devPassword = process.env.SCREENSCRAPER_DEV_PASSWORD
  
  if (!devId || !devPassword) {
    throw new Error('Identifiants Screenscraper manquants')
  }
  
  try {
    console.log('🎮 Début du scraping des genres depuis Screenscraper...')
    
    const url = `https://api.screenscraper.fr/api2/genresListe.php?devid=${devId}&devpassword=${devPassword}&output=json`
    
    console.log('📡 Récupération des genres depuis l\'API Screenscraper...')
    const response = await rateLimitedFetch(url)
    
    if (!response.ok) {
      throw new Error(`Erreur API Screenscraper: ${response.status} ${response.statusText}`)
    }
    
    const data: ScreenscraperGenresResponse = await response.json()
    
    if (!data.response?.genres) {
      throw new Error('Réponse API invalide: pas de genres trouvés')
    }
    
    const genreEntries = Object.entries(data.response.genres)
    console.log(`📊 ${genreEntries.length} genres trouvés dans l'API Screenscraper`)
    
    let createdCount = 0
    let updatedCount = 0
    
    for (const [, genre] of genreEntries) {
      // Utiliser le nom français uniquement
      const frenchName = genre.nom_fr
      
      if (!frenchName) {
        console.warn(`⚠️ Genre ID ${genre.id}: aucun nom français trouvé, ignoré`)
        continue
      }
      
      // Convertir parent en nombre (0 = genre principal)
      const parentId = parseInt(genre.parent) || null
      const isMainGenre = parentId === null || parentId === 0
      
      // Vérifier si le genre existe déjà
      const existingGenre = await prisma.genre.findUnique({
        where: { screenscrapeId: genre.id }
      })
      
      if (existingGenre) {
        // Mettre à jour le genre existant
        await prisma.genre.update({
          where: { id: existingGenre.id },
          data: {
            name: frenchName,
            parentId: parentId,
            isMainGenre: isMainGenre,
            updatedAt: new Date()
          }
        })
        updatedCount++
        console.log(`🔄 Genre mis à jour: ${frenchName} (ID: ${genre.id})`)
      } else {
        // Créer un nouveau genre
        await prisma.genre.create({
          data: {
            screenscrapeId: genre.id,
            name: frenchName,
            parentId: parentId,
            isMainGenre: isMainGenre
          }
        })
        createdCount++
        console.log(`✅ Genre créé: ${frenchName} (ID: ${genre.id})`)
      }
    }
    
    const totalProcessed = createdCount + updatedCount
    console.log(`🎯 Scraping terminé: ${createdCount} créés, ${updatedCount} mis à jour, ${totalProcessed} total`)
    
    return {
      success: true,
      count: totalProcessed,
      message: `Scraping réussi: ${createdCount} genres créés, ${updatedCount} mis à jour`
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du scraping des genres:', error)
    return {
      success: false,
      count: 0,
      message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    }
  }
}

// Fonction pour synchroniser les genres des jeux existants avec la table Genre
export async function syncGameGenresToNormalizedStructure(): Promise<{ success: boolean, count: number, message: string }> {
  try {
    console.log('🔄 Début de la synchronisation des genres des jeux...')
    
    // Récupérer tous les jeux qui ont un genre (string) mais pas de GameGenre associé
    const gamesWithStringGenres = await prisma.game.findMany({
      where: {
        genreId: {
          not: null
        }
      },
      include: {
        genres: true
      }
    })
    
    console.log(`📊 ${gamesWithStringGenres.length} jeux trouvés avec des genres en format string`)
    
    let processedCount = 0
    
    for (const game of gamesWithStringGenres) {
      if (!game.genreId) continue
      
      // Chercher le genre correspondant dans la table Genre
      const matchingGenre = await prisma.genre.findFirst({
        where: {
          screenscrapeId: game.genreId
        }
      })
      
      if (matchingGenre) {
        // Vérifier si la relation GameGenre existe déjà
        const existingGameGenre = await prisma.gameGenre.findUnique({
          where: {
            gameId_genreId: {
              gameId: game.id,
              genreId: matchingGenre.screenscrapeId
            }
          }
        })
        
        if (!existingGameGenre) {
          // Créer la relation GameGenre
          await prisma.gameGenre.create({
            data: {
              gameId: game.id,
              genreId: matchingGenre.screenscrapeId,
              genreName: matchingGenre.name,
              isPrimary: true // Premier genre = primaire
            }
          })
          
          processedCount++
          console.log(`✅ Genre associé: ${game.title} -> ${matchingGenre.name}`)
        }
      } else {
        console.warn(`⚠️ Genre non trouvé pour l'ID "${game.genreId}" dans le jeu "${game.title}"`)
      }
    }
    
    console.log(`🎯 Synchronisation terminée: ${processedCount} relations GameGenre créées`)
    
    return {
      success: true,
      count: processedCount,
      message: `Synchronisation réussie: ${processedCount} relations créées`
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation des genres:', error)
    return {
      success: false,
      count: 0,
      message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    }
  }
}