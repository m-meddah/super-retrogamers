'use server'

import { prisma } from '@/lib/prisma'

/**
 * Vérifie si nous avons des genres disponibles dans la base de données
 */
export async function checkGenresAvailability(): Promise<{ hasGenres: boolean; count: number }> {
  try {
    const count = await prisma.genre.count()
    return {
      hasGenres: count > 0,
      count
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des genres:', error)
    return {
      hasGenres: false,
      count: 0
    }
  }
}

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
        where: { ssGenreId: genre.id }
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
            ssGenreId: genre.id,
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

// Fonction obsolète - les genres sont maintenant gérés par relation directe genreId
// Cette fonction peut être supprimée dans une future version
export async function syncGameGenresToNormalizedStructure(): Promise<{ success: boolean, count: number, message: string }> {
  console.log('⚠️ Cette fonction est obsolète - les genres utilisent maintenant une relation directe genreId')
  return {
    success: true,
    count: 0,
    message: 'Cette fonction n\'est plus nécessaire avec la nouvelle structure normalisée'
  }
}