'use server'

import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'

interface ScreenscraperGame {
  id: number
  noms: {
    nom_eu?: string
    nom_us?: string
    nom_recalbox?: string
    nom_retropie?: string
    nom_launchbox?: string
    nom_hyperspin?: string
    noms_commun?: string
  }
  systeme: {
    id: number
    noms: {
      nom_eu?: string
      nom_us?: string
    }
  }
  editeur?: string
  developpeur?: string
  joueurs?: string
  note?: string
  topstaff?: string
  rotation?: string
  synopsis?: {
    synopsis_eu?: string
    synopsis_us?: string
  }
  medias?: {
    type: string
    parent: string
    url: string
    region: string
    support: string
    crc: string
    md5: string
    sha1: string
    format: string
  }[]
  genres?: {
    id: number
    nom_principal: string
  }[]
  dates?: {
    date_eu?: string
    date_us?: string
    date_jp?: string
    date_wor?: string
  }
}

// Interface pour les réponses futures (actuellement non utilisée)
// interface ScreenscraperGamesResponse {
//   response: {
//     jeux: ScreenscraperGame[]
//   }
// }

// Rate limiting: 1.2 secondes entre les requêtes
const RATE_LIMIT_MS = 1200
let lastRequestTime = 0

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    const waitTime = RATE_LIMIT_MS - timeSinceLastRequest
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
  
  lastRequestTime = Date.now()
  return fetch(url)
}

/**
 * Récupère la liste des jeux pour une console donnée depuis Screenscraper
 * @param systemId L'ID du système sur Screenscraper (ex: 13 pour GameCube)
 * @returns Liste des IDs de jeux Screenscraper
 */
export async function getGameIdsForSystem(systemId: number): Promise<number[]> {
  try {
    console.log(`Récupération des jeux pour le système ${systemId} via CSV...`)
    
    // Approche : Télécharger le fichier CSV directement depuis le dossier medias
    const csvUrl = `https://www.screenscraper.fr/medias/${systemId}/gameslist.csv`
    
    console.log(`Téléchargement du CSV: ${csvUrl}`)
    const response = await rateLimitedFetch(csvUrl)
    
    if (!response.ok) {
      console.error(`Erreur lors du téléchargement du CSV: ${response.status}`)
      return []
    }
    
    const csvContent = await response.text()
    console.log(`CSV téléchargé, taille: ${csvContent.length} caractères`)
    
    // Parser le CSV pour extraire les IDs
    const gameIds: number[] = []
    const lines = csvContent.split('\n')
    
    // La première ligne contient généralement les en-têtes
    console.log(`Première ligne (en-têtes): ${lines[0]}`)
    console.log(`Quelques lignes d'exemple:`)
    for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
      console.log(`Ligne ${i}: ${lines[i]}`)
    }
    
    // Analyser les en-têtes pour trouver la colonne ID
    const headers = lines[0].split(';').map(h => h.trim().toLowerCase().replace(/"/g, ''))
    const idColumnIndex = headers.findIndex(h => h.includes('id') || h.includes('screenscraper'))
    
    console.log(`Colonnes trouvées: ${headers.join(', ')}`)
    console.log(`Index de la colonne ID: ${idColumnIndex}`)
    
    if (idColumnIndex === -1) {
      console.error('Colonne ID non trouvée dans le CSV')
      return []
    }
    
    // Parser chaque ligne pour extraire l'ID
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const columns = line.split(';').map(col => col.trim().replace(/"/g, ''))
      if (columns.length > idColumnIndex) {
        const id = parseInt(columns[idColumnIndex])
        if (!isNaN(id) && id > 0) {
          gameIds.push(id)
        }
      }
    }
    
    console.log(`Total: ${gameIds.length} jeux trouvés dans le CSV pour le système ${systemId}`)
    return gameIds
    
  } catch (error) {
    console.error(`Erreur lors de la récupération des jeux pour le système ${systemId}:`, error)
    return []
  }
}

/**
 * Récupère les IDs de jeux pour toutes les consoles dans la base de données
 * @returns Map avec systemId -> gameIds[]
 */
export async function getAllGameIdsForAllSystems(): Promise<Map<number, number[]>> {
  try {
    // Récupérer toutes les consoles avec leur screenscrapeId
    const consoles = await prisma.console.findMany({
      where: {
        screenscrapeId: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        screenscrapeId: true
      }
    })
    
    console.log(`${consoles.length} consoles trouvées dans la base de données`)
    
    const gameIdsMap = new Map<number, number[]>()
    
    for (const gameConsole of consoles) {
      if (gameConsole.screenscrapeId) {
        console.log(`\nTraitement: ${gameConsole.name} (ID: ${gameConsole.screenscrapeId})`)
        const gameIds = await getGameIdsForSystem(gameConsole.screenscrapeId)
        gameIdsMap.set(gameConsole.screenscrapeId, gameIds)
        
        // Pause entre chaque console pour respecter les limites
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    return gameIdsMap
    
  } catch (error) {
    console.error('Erreur lors de la récupération des IDs de jeux:', error)
    return new Map()
  }
}

/**
 * Sauvegarde les IDs de jeux dans un fichier JSON pour référence
 * @param gameIdsMap Map des IDs de jeux par système
 */
export async function saveGameIdsToFile(gameIdsMap: Map<number, number[]>): Promise<void> {
  try {
    const data = Object.fromEntries(gameIdsMap)
    const jsonData = JSON.stringify(data, null, 2)
    
    await fs.writeFile('screenscraper-game-ids.json', jsonData, 'utf-8')
    console.log('IDs de jeux sauvegardés dans screenscraper-game-ids.json')
    
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
  }
}

/**
 * Génère un slug pour un jeu avec le format console-slug-game-slug
 */
function generateGameSlug(gameTitle: string, consoleSlug: string): string {
  const gameSlug = gameTitle
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    
  return `${consoleSlug}-${gameSlug}`
}

/**
 * Récupère les détails d'un jeu depuis Screenscraper
 */
async function getGameDetails(gameId: number): Promise<ScreenscraperGame | null> {
  try {
    const url = `https://www.screenscraper.fr/api2/jeuInfos.php?devid=${process.env.SCREENSCRAPER_DEV_ID}&devpassword=${process.env.SCREENSCRAPER_DEV_PASSWORD}&softname=super-retrogamers&output=json&jeu=${gameId}`
    
    const response = await rateLimitedFetch(url)
    
    if (!response.ok) {
      console.error(`Erreur API pour le jeu ${gameId}: ${response.status}`)
      return null
    }
    
    const data = await response.json()
    
    if (!data.response || !data.response.jeu) {
      console.error(`Données manquantes pour le jeu ${gameId}`)
      return null
    }
    
    return data.response.jeu
    
  } catch (error) {
    console.error(`Erreur lors de la récupération du jeu ${gameId}:`, error)
    return null
  }
}

/**
 * Scrape et enregistre les jeux pour une console donnée
 */
export async function scrapeGamesForConsole(consoleId: string, systemId: number, limit?: number): Promise<void> {
  try {
    // Récupérer la console
    const gameConsole = await prisma.console.findUnique({
      where: { id: consoleId }
    })
    
    if (!gameConsole) {
      throw new Error(`Console avec ID ${consoleId} non trouvée`)
    }
    
    console.log(`🎮 Scraping des jeux pour ${gameConsole.name} (système ${systemId})`)
    
    // Récupérer les IDs de jeux
    const gameIds = await getGameIdsForSystem(systemId)
    
    if (gameIds.length === 0) {
      console.log('Aucun jeu trouvé pour cette console')
      return
    }
    
    // Limiter le nombre de jeux si spécifié
    const gamesToProcess = limit ? gameIds.slice(0, limit) : gameIds
    console.log(`Traitement de ${gamesToProcess.length} jeux sur ${gameIds.length} disponibles`)
    
    let processedCount = 0
    let createdCount = 0
    
    for (const gameId of gamesToProcess) {
      try {
        // Vérifier si le jeu existe déjà
        const existingGame = await prisma.game.findFirst({
          where: {
            screenscrapeId: gameId,
            consoleId: gameConsole.id
          }
        })
        
        if (existingGame) {
          console.log(`Jeu ${gameId} déjà existant, ignoré`)
          processedCount++
          continue
        }
        
        // Récupérer les détails du jeu
        const gameDetails = await getGameDetails(gameId)
        
        if (!gameDetails) {
          console.log(`Impossible de récupérer les détails du jeu ${gameId}`)
          processedCount++
          continue
        }
        
        // Extraire les informations du jeu
        const gameTitle = gameDetails.noms?.nom_eu || gameDetails.noms?.nom_us || gameDetails.noms?.noms_commun || `Jeu ${gameId}`
        const slug = generateGameSlug(gameTitle, gameConsole.slug)
        
        // Vérifier l'unicité du slug
        let finalSlug = slug
        let counter = 2
        
        while (await prisma.game.findUnique({ where: { slug: finalSlug } })) {
          finalSlug = `${slug}-${counter}`
          counter++
        }
        
        // Extraire les autres informations
        const genre = gameDetails.genres?.[0]?.nom_principal || null
        const developer = gameDetails.developpeur || null
        const publisher = gameDetails.editeur || null
        const description = gameDetails.synopsis?.synopsis_eu || gameDetails.synopsis?.synopsis_us || null
        const rating = gameDetails.note ? parseFloat(gameDetails.note) : null
        
        // Déterminer l'année de sortie
        let releaseYear: number | null = null
        if (gameDetails.dates) {
          const dateStr = gameDetails.dates.date_eu || gameDetails.dates.date_us || gameDetails.dates.date_wor
          if (dateStr) {
            const year = parseInt(dateStr.split('-')[0])
            if (year > 1970 && year < 2030) {
              releaseYear = year
            }
          }
        }
        
        // Créer le jeu dans la base de données
        await prisma.game.create({
          data: {
            slug: finalSlug,
            title: gameTitle,
            consoleId: gameConsole.id,
            screenscrapeId: gameId,
            releaseYear,
            genre,
            developer,
            publisher,
            description,
            rating,
            screenshots: [] // TODO: Traiter les médias plus tard
          }
        })
        
        console.log(`✅ Jeu créé: ${gameTitle} (${finalSlug})`)
        createdCount++
        
      } catch (error) {
        console.error(`Erreur lors du traitement du jeu ${gameId}:`, error)
      }
      
      processedCount++
      
      // Pause pour respecter les limites de taux
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
    
    console.log(`\n🎉 Scraping terminé pour ${gameConsole.name}`)
    console.log(`   - Jeux traités: ${processedCount}`)
    console.log(`   - Jeux créés: ${createdCount}`)
    console.log(`   - Jeux ignorés: ${processedCount - createdCount}`)
    
  } catch (error) {
    console.error('Erreur lors du scraping des jeux:', error)
    throw error
  }
}