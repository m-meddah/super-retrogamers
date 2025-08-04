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
    noms: any
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

interface ScreenscraperGamesResponse {
  response: {
    jeux: ScreenscraperGame[]
  }
}

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
    
    for (const console of consoles) {
      if (console.screenscrapeId) {
        console.log(`\nTraitement: ${console.name} (ID: ${console.screenscrapeId})`)
        const gameIds = await getGameIdsForSystem(console.screenscrapeId)
        gameIdsMap.set(console.screenscrapeId, gameIds)
        
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