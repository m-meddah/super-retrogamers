'use server'

import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

// Complete Screenscraper Game interface based on API documentation
interface ScreenscraperGame {
  id: number
  romid?: number
  notgame?: boolean
  nom?: string
  
  // Names in different regions
  noms?: {
    nom_ss?: string
    nom_eu?: string
    nom_us?: string
    nom_fr?: string
    nom_jp?: string
    nom_wor?: string
    nom_recalbox?: string
    nom_retropie?: string
    nom_launchbox?: string
    nom_hyperspin?: string
    noms_commun?: string
  }
  
  // Region short names
  regionshortnames?: {
    regionshortname?: string
  }
  
  cloneof?: number
  
  // System information
  systeme?: {
    id: number
    nom?: string
    parentid?: number
    noms?: {
      nom_eu?: string
      nom_us?: string
    }
  }
  
  // Publisher and developer - enhanced structure
  editeur?: {
    id?: number
    text?: string
    nom?: string
  } | string
  
  editeurmedias?: {
    editeurmedia_pictomonochrome?: string
    editeurmedia_pictocouleur?: string
  }
  
  developpeur?: {
    id?: number
    text?: string
    nom?: string
  } | string
  
  developpeurmedias?: {
    developpeurmedia_pictomonochrome?: string
    developpeurmedia_pictocouleur?: string
  }
  
  // Game info
  joueurs?: string
  note?: number | string  // Rating out of 20
  topstaff?: number | string  // Top staff inclusion (0/1)
  rotation?: string
  resolution?: string
  
  // Descriptions
  synopsis?: {
    synopsis_eu?: string
    synopsis_us?: string
    synopsis_fr?: string
    synopsis_jp?: string
    synopsis_wor?: string
  }
  
  // Classifications
  classifications?: {
    [organisme: string]: string
  }
  
  // Release dates by region
  dates?: {
    date_eu?: string
    date_us?: string
    date_jp?: string
    date_fr?: string
    date_wor?: string
  }
  
  // Genres - enhanced structure
  genres?: {
    genres_id?: Array<{
      genre_id: number
      nomcourt?: number
      principale?: number
      parentid?: number
      text?: string
      nom?: string
    }>
    genres_eu?: string[]
    genres_us?: string[]
    genres_fr?: string[]
  }
  
  // Game modes - enhanced structure
  modes?: {
    modes_id?: Array<{
      mode_id: number
      text?: string
      nom?: string
    }>
    modes_eu?: string[]
    modes_us?: string[]
    modes_fr?: string[]
  }
  
  // Game families - enhanced structure
  familles?: {
    familles_id?: Array<{
      famille_id: number
      text?: string
      nom?: string
    }>
    familles_eu?: string[]
    familles_us?: string[]
    familles_fr?: string[]
  }
  
  // Themes
  themes?: {
    themes_id?: Array<{
      theme_id: number
    }>
    themes_eu?: string[]
    themes_us?: string[]
    themes_fr?: string[]
  }
  
  // Media files
  medias?: ScreenscraperGameMedia
  
  // ROM information
  roms?: Array<{
    romid: number
    romnumsupport?: number
    romtotalsupport?: number
    romfilename?: string
    romsize?: number
    romcrc?: string
    rommd5?: string
    romsha1?: string
    beta?: number
    demo?: number
    trad?: number
    hack?: number
    unl?: number
    alt?: number
    best?: number
    netplay?: number
  }>
  
  // Specific ROM info (if scraped by ROM)
  rom?: {
    romid: number
    romnumsupport?: number
    romtotalsupport?: number
    romfilename?: string
    romregions?: string
    romlangues?: string
    romtype?: string
    romsupporttype?: string
    romsize?: number
    romcrc?: string
    rommd5?: string
    romsha1?: string
    beta?: number
    demo?: number
    trad?: number
    hack?: number
    unl?: number
    alt?: number
    best?: number
    netplay?: number
  }
}

// Media interface for actual Screenscraper response structure
interface ScreenscraperGameMediaItem {
  type: string          // e.g. "sstitle", "ss", "wheel", "box-2D", "fanart", etc.
  parent: string        // e.g. "jeu"
  url: string          // Direct download URL
  region: string       // e.g. "wor", "eu", "us", "fr", "jp"
  crc?: string
  md5?: string
  sha1?: string
  size?: string        // File size in bytes
  format: string       // e.g. "png", "jpg", "mp4", "pdf"
}

// Media array type (actual structure from Screenscraper API)
type ScreenscraperGameMedia = ScreenscraperGameMediaItem[]

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
 * Génère un slug pour un jeu basé sur le titre du jeu uniquement
 */
function generateGameSlug(gameTitle: string): string {
  const gameSlug = gameTitle
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    
  // Return only the game slug, not prefixed with console slug
  return gameSlug
}

/**
 * Parse date string from Screenscraper format
 */
function parseScreenscraperDate(dateStr: string): Date | null {
  try {
    if (!dateStr) return null
    
    // Screenscraper dates are usually in YYYY-MM-DD format
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    
    // Sanity check for reasonable game release dates
    const year = date.getFullYear()
    if (year < 1970 || year > 2030) return null
    
    return date
  } catch {
    return null
  }
}

/**
 * Extract the primary release year from date information
 */
function extractReleaseYear(dates?: ScreenscraperGame['dates']): number | null {
  if (!dates) return null
  
  const dateStr = dates.date_eu || dates.date_fr || dates.date_us || dates.date_wor || dates.date_jp
  if (!dateStr) return null
  
  try {
    const year = parseInt(dateStr.split('-')[0])
    return (year > 1970 && year < 2030) ? year : null
  } catch {
    return null
  }
}

/**
 * Process ROM flags from Screenscraper data
 */
function processRomFlags(gameDetails: ScreenscraperGame) {
  const rom = gameDetails.rom || (gameDetails.roms && gameDetails.roms[0])
  if (!rom) return {}
  
  return {
    isDemo: Boolean(rom.demo),
    isBeta: Boolean(rom.beta),
    isTranslated: Boolean(rom.trad),
    isHacked: Boolean(rom.hack),
    isUnlicensed: Boolean(rom.unl),
    isAlternative: Boolean(rom.alt),
    isBestVersion: Boolean(rom.best),
    netplaySupport: Boolean(rom.netplay)
  }
}





/**
 * Create a comprehensive game record from Screenscraper data
 */
export async function createGameFromScreenscraper(
  gameDetails: ScreenscraperGame, 
  gameConsole: { id: string; slug: string; name: string }
) {
  try {
    // Check if game should be skipped
    if (gameDetails.notgame) {
      console.log(`🚫 Jeu ${gameDetails.id} ignoré (notgame = true)`)
      return null
    }
    
    if (gameDetails.cloneof && gameDetails.cloneof !== 0) {
      console.log(`🚫 Jeu ${gameDetails.id} ignoré (clone de ${gameDetails.cloneof})`)
      return null
    }
    // Extract basic information
    const gameTitle = gameDetails.noms?.nom_fr || gameDetails.noms?.nom_eu || 
                     gameDetails.noms?.nom_us || gameDetails.noms?.noms_commun || 
                     gameDetails.nom || `Jeu ${gameDetails.id}`
    
    const slug = generateGameSlug(gameTitle)
    
    // Ensure slug uniqueness
    let finalSlug = slug
    let counter = 2
    
    while (await prisma.game.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`
      counter++
    }
    
    // Extract all the rich data
    const description = gameDetails.synopsis?.synopsis_fr || gameDetails.synopsis?.synopsis_eu || 
                       gameDetails.synopsis?.synopsis_us || null
    
    // Handle different note formats from Screenscraper
    let rating: number | null = null
    if (gameDetails.note) {
      if (typeof gameDetails.note === 'number') {
        rating = gameDetails.note
      } else if (typeof gameDetails.note === 'string') {
        const parsed = parseFloat(gameDetails.note)
        rating = isNaN(parsed) ? null : parsed
      } else if (typeof gameDetails.note === 'object') {
        // Handle object format: extract text content or numeric value
        const noteObj = gameDetails.note as Record<string, unknown>
        const noteValue = noteObj.text || noteObj.value || noteObj[Object.keys(noteObj)[0]]
        if (noteValue !== undefined) {
          const parsed = parseFloat(String(noteValue))
          rating = isNaN(parsed) ? null : parsed
        }
      }
    }
    
    // Handle topstaff field
    let topStaff = false
    if (gameDetails.topstaff) {
      if (typeof gameDetails.topstaff === 'number' || typeof gameDetails.topstaff === 'string') {
        topStaff = parseInt(gameDetails.topstaff as string) === 1
      } else {
        topStaff = Boolean(gameDetails.topstaff)
      }
    }
    
    // Handle developer and publisher relations (commented until Company table exists)
    // const developerId = await createOrGetCompany(gameDetails.developpeur, 'developpeur')
    // const publisherId = await createOrGetCompany(gameDetails.editeur, 'editeur')
    const developerId: string | null = null
    const publisherId: string | null = null
    
    // Keep legacy fields for backward compatibility
    let developer: string | null = null
    if (gameDetails.developpeur) {
      if (typeof gameDetails.developpeur === 'string') {
        developer = gameDetails.developpeur
      } else if (typeof gameDetails.developpeur === 'object') {
        const devObj = gameDetails.developpeur as Record<string, unknown>
        const value = devObj.text || devObj.nom || devObj.name || devObj[Object.keys(devObj)[0]]
        developer = typeof value === 'string' ? value : null
      }
    }
    
    let publisher: string | null = null
    if (gameDetails.editeur) {
      if (typeof gameDetails.editeur === 'string') {
        publisher = gameDetails.editeur
      } else if (typeof gameDetails.editeur === 'object') {
        const pubObj = gameDetails.editeur as Record<string, unknown>
        const value = pubObj.text || pubObj.nom || pubObj.name || pubObj[Object.keys(pubObj)[0]]
        publisher = typeof value === 'string' ? value : null
      }
    }
    
    // Handle player count
    let playerCount: string | null = null
    if (gameDetails.joueurs) {
      if (typeof gameDetails.joueurs === 'string') {
        playerCount = gameDetails.joueurs
      } else if (typeof gameDetails.joueurs === 'object') {
        const playersObj = gameDetails.joueurs as Record<string, unknown>
        const value = playersObj.text || playersObj.value || playersObj[Object.keys(playersObj)[0]]
        playerCount = value ? String(value) : null
      }
    }
    
    const romFlags = processRomFlags(gameDetails)
    const releaseYear = extractReleaseYear(gameDetails.dates)
    
    // Create the main game record
    const gameData = {
      slug: finalSlug,
      title: gameTitle,
      consoleId: gameConsole.id,
      screenscrapeId: typeof gameDetails.id === 'number' ? gameDetails.id : parseInt(String(gameDetails.id)),
      
      // Basic info
      releaseYear,
      description,
      
      // Company relations
      developerId,
      publisherId,
      
      // Legacy fields (for backward compatibility)
      developer,
      publisher,
      
      // Enhanced data
      rating,
      topStaff,
      playerCount,
      rotation: gameDetails.rotation || null,
      resolution: gameDetails.resolution || null,
      
      // ROM flags
      ...romFlags,
      
      // Clone information
      isClone: Boolean(gameDetails.cloneof && gameDetails.cloneof !== 0),
      cloneOfId: (gameDetails.cloneof && gameDetails.cloneof !== 0) ? gameDetails.cloneof : null,
      
      // Release dates by region
      releaseDateFR: gameDetails.dates?.date_fr ? parseScreenscraperDate(gameDetails.dates.date_fr) : null,
      releaseDateEU: gameDetails.dates?.date_eu ? parseScreenscraperDate(gameDetails.dates.date_eu) : null,
      releaseDateUS: gameDetails.dates?.date_us ? parseScreenscraperDate(gameDetails.dates.date_us) : null,
      releaseDateJP: gameDetails.dates?.date_jp ? parseScreenscraperDate(gameDetails.dates.date_jp) : null,
      releaseDateWOR: gameDetails.dates?.date_wor ? parseScreenscraperDate(gameDetails.dates.date_wor) : null,
      
      // Simple genre for now (will be enhanced with genres relation)
      genre: gameDetails.genres?.genres_fr?.[0] || gameDetails.genres?.genres_eu?.[0] || null
    }
    
    // Create the game
    const createdGame = await prisma.game.create({
      data: gameData
    })
    
    // Process genres if available (commented until Genre table exists)
    if (gameDetails.genres?.genres_id) {
      // await processGameGenres(createdGame.id, gameDetails.genres)
      console.log(`📋 ${gameDetails.genres.genres_id.length} genres trouvés (table Genre pas encore créée)`)
    }
    
    // Process modes if available (commented until GameMode table exists)
    if (gameDetails.modes?.modes_id) {
      // await processGameModes(createdGame.id, gameDetails.modes)
      console.log(`🎮 ${gameDetails.modes.modes_id.length} modes trouvés (table GameMode pas encore créée)`)
    }
    
    // Process families if available (commented until GameFamily table exists)
    if (gameDetails.familles?.familles_id) {
      // await processGameFamilies(createdGame.id, gameDetails.familles)
      console.log(`👨‍👩‍👧‍👦 ${gameDetails.familles.familles_id.length} familles trouvées (table GameFamily pas encore créée)`)
    }
    
    // Process media files
    if (gameDetails.medias) {
      await processGameMedias(createdGame.id, gameDetails.medias, finalSlug, gameConsole.slug)
    }
    
    return createdGame
    
  } catch (error) {
    console.error('Erreur lors de la création du jeu:', error)
    return null
  }
}

/**
 * Process and download game media files
 */
async function processGameMedias(
  gameId: string, 
  mediasData: ScreenscraperGameMedia,
  gameSlug: string,
  consoleSlug: string
) {
  try {
    if (!mediasData || !Array.isArray(mediasData) || mediasData.length === 0) {
      console.log('⚠️  Aucune donnée média disponible')
      return
    }

    console.log(`📁 Traitement des médias pour ${gameSlug}...`)
    console.log(`   ${mediasData.length} médias disponibles depuis Screenscraper`)

    const processedMedias: Array<{
      mediaType: string
      region: string
      format: string
      url: string
      fileName: string
      localPath: string | null
      
      // Enhanced metadata from Screenscraper API
      parent?: string
      crc?: string
      md5?: string
      sha1?: string
      size?: string
      
      // Parsed metadata
      width?: number
      height?: number
      fileSize?: number
      
      // Media attributes
      isTexture?: boolean
      is2D?: boolean
      supportNumber?: number
      pageNumber?: number
      
      // Error handling
      downloadError?: string
    }> = []

    // Process ALL media types (no priority filtering, you'll filter later)
    console.log(`   Types de médias trouvés: ${mediasData.map(m => m.type).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`)

    // Process all media items
    for (const media of mediasData) {
      try {
        // Skip excluded regions or formats (you can modify this later)
        if (shouldSkipMedia(media)) {
          console.log(`   ⏭️  ${media.type} (${media.region}) ignoré par les filtres`)
          continue
        }

        const fileName = `${gameSlug}_${media.type}_${media.region}.${media.format}`
        let localPath: string | null = null
        let downloadError: string | null = null
        
        try {
          localPath = await downloadGameMedia(media.url, fileName, gameSlug, media.type, media.region, consoleSlug)
          if (localPath) {
            console.log(`   ✅ ${media.type} (${media.region}) téléchargé`)
          } else {
            downloadError = 'Échec téléchargement'
            console.log(`   ❌ ${media.type} (${media.region}) échec téléchargement`)
          }
        } catch (error) {
          downloadError = error instanceof Error ? error.message : 'Erreur inconnue'
          console.log(`   ❌ ${media.type} (${media.region}) erreur: ${downloadError}`)
        }
        
        // Parse file size
        let parsedFileSize: number | undefined
        if (media.size) {
          const sizeNum = parseInt(media.size)
          parsedFileSize = isNaN(sizeNum) ? undefined : sizeNum
        }
        
        // Always save media info to database (even if download failed)
        processedMedias.push({
          mediaType: media.type,
          region: media.region,
          format: media.format,
          url: media.url,
          fileName,
          localPath,
          
          // Enhanced metadata from API
          parent: media.parent,
          crc: media.crc,
          md5: media.md5,
          sha1: media.sha1,
          size: media.size,
          
          // Parsed metadata
          fileSize: parsedFileSize,
          
          // Media attributes (you can enhance these based on media type)
          is2D: media.type.includes('2D') || !media.type.includes('3D'),
          isTexture: media.type.includes('texture'),
          
          // Error info
          downloadError: downloadError || undefined
        })
        
      } catch (error) {
        console.error(`   ❌ Erreur traitement ${media.type}:`, error)
      }
    }

    // Save all processed media to database with enhanced metadata
    if (processedMedias.length > 0) {
      const mediaData = processedMedias.map(media => ({
        gameId,
        mediaType: media.mediaType,
        region: media.region,
        format: media.format,
        url: media.url,
        localPath: media.localPath,
        fileName: media.fileName,
        
        // Enhanced metadata from API
        parent: media.parent || 'jeu',
        crc: media.crc || null,
        md5: media.md5 || null,
        sha1: media.sha1 || null,
        size: media.size || null,
        
        // Parsed metadata
        width: media.width || null,
        height: media.height || null,
        fileSize: media.fileSize || null,
        
        // Media type attributes
        isTexture: Boolean(media.isTexture),
        is2D: Boolean(media.is2D),
        supportNumber: media.supportNumber || null,
        pageNumber: media.pageNumber || null,
        
        // Download status
        downloadAttempted: Boolean(media.localPath || media.downloadError),
        downloadSuccess: Boolean(media.localPath),
        downloadError: media.downloadError || undefined
      }))

      await prisma.gameMedia.createMany({
        data: mediaData,
        skipDuplicates: true
      })

      console.log(`📁 ${processedMedias.length} médias sauvegardés en base pour ${gameSlug}`)
    } else {
      console.log(`⚠️  Aucun média traité pour ${gameSlug}`)
    }

  } catch (error) {
    console.error('Erreur traitement médias jeu:', error)
  }
}

/**
 * Check if media should be skipped based on type, region, or other criteria
 */
function shouldSkipMedia(media: ScreenscraperGameMediaItem): boolean {
  // ⚠️ CONFIGURATION UTILISATEUR - Types de médias à exclure
  // Vous pouvez modifier cette liste pour contrôler quels types de médias télécharger
  
  // Types actuellement exclus (vous pouvez les commenter pour les inclure) :
  const excludedTypes = [
    // Images de boîtes et emballages
    // 'box-2D',        // Boîte 2D - DÉJÀ INCLUS
    // 'box-3D',        // Boîte 3D - DÉJÀ INCLUS  
    'box-texture',   // Texture de boîte
    // 'box-back',      // Dos de boîte
    // 'box-spine',     // Tranche de boîte
    // 'box-side',      // Côté de boîte
    
    // Supports physiques
    'support-2D',    // Support 2D (CD, cartouche)
    'support-3D',    // Support 3D
    'support-texture', // Texture du support
    
    // Screenshots et images de jeu
    // 'ss',            // Screenshots - DÉJÀ INCLUS
    // 'sstitle',       // Screenshot titre - DÉJÀ INCLUS
    'fanart',        // Fan art (décommentez si vous voulez)
    
    // Logos et éléments graphiques
    // 'wheel',         // Logo wheel - DÉJÀ INCLUS
    // 'marquee',       // Marquee d'arcade
    // 'logo',          // Logo simple
    
    // Éléments d'interface
    'bezel',         // Bezels pour émulateurs
    'overlay',       // Overlays
    'background',    // Arrière-plans
    
    // Documentation
    // 'manual',        // Manuels (PDF)
    'advert',        // Publicités
    'flyer',         // Flyers
    
    // Médias spécialisés
    'video',         // Vidéos (gourmandes en espace)
    'music',         // Musiques
    'voice',         // Voix/dialogues
    
    // Éléments techniques
    'map',           // Cartes de jeu
    'titleshot',     // Écran titre
    'gameplay',      // Gameplay footage
    
    // Éditeur/Développeur
    'mixrbv1',       // Images mixtes
    'mixrbv2',       // Images mixtes v2
    
    // Classifications et labels
    'rating',        // Classifications d'âge
    'region',        // Indicateurs régionaux
  ]

  // Vérifier si le type de média est exclu
  if (excludedTypes.some(excluded => media.type.toLowerCase().includes(excluded.toLowerCase()))) {
    return true
  }

  // ⚠️ CONFIGURATION UTILISATEUR - Régions à exclure
  const excludedRegions = [
    // 'wor',        // World - DÉJÀ INCLUS
    // 'us',         // États-Unis - DÉJÀ INCLUS  
    // 'eu',         // Europe - DÉJÀ INCLUS
    // 'jp',         // Japon - DÉJÀ INCLUS
    // 'fr',         // France
    'cus',        // Custom/personnalisé
    'br',         // Brésil (décommentez si vous ne voulez pas)
    'de',         // Allemagne
    'es',         // Espagne
    'it',         // Italie
    'kr',         // Corée du Sud
    'cn',         // Chine
    'au',         // Australie
    'nl',         // Pays-Bas
    'se',         // Suède
    'no',         // Norvège
    'dk',         // Danemark
    'fi',         // Finlande
  ]

  if (media.region && excludedRegions.includes(media.region.toLowerCase())) {
    return true
  }

  // ⚠️ CONFIGURATION UTILISATEUR - Limite de taille des fichiers
  // Actuellement : 50MB max (vous pouvez augmenter/diminuer)
  const maxSizeBytes = 50 * 1024 * 1024 // 50MB
  if (media.size && parseInt(media.size) > maxSizeBytes) {
    console.log(`   📦 ${media.type} (${media.region}) trop volumineux: ${Math.round(parseInt(media.size) / 1024 / 1024)}MB`)
    return true
  }

  return false
}

/**
 * Download game media with proper directory structure: public/games/[game-slug]-[console-slug]/[mediaType]/[region]/
 */
async function downloadGameMedia(
  url: string, 
  fileName: string, 
  gameSlug: string, 
  mediaType: string, 
  region: string,
  consoleSlug?: string
): Promise<string | null> {
  try {
    // Skip if region is undefined to avoid path errors
    if (!region || region === 'undefined') {
      console.log(`   ⚠️  Région manquante pour ${mediaType}, ignoré`)
      return null
    }
    
    // Create directory structure: public/games/[game-slug]-[console-slug]/[mediaType]/[region]/
    const gamesDir = path.join(process.cwd(), 'public', 'games')
    const gameDir = path.join(gamesDir, consoleSlug ? `${gameSlug}-${consoleSlug}` : gameSlug)
    const mediaTypeDir = path.join(gameDir, mediaType)
    const regionDir = path.join(mediaTypeDir, region)
    
    // Create all necessary directories
    await fs.mkdir(regionDir, { recursive: true })
    
    const response = await rateLimitedFetch(url)
    if (!response.ok) {
      console.error(`Erreur téléchargement média ${url}: ${response.status}`)
      return null
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const filePath = path.join(regionDir, fileName)
    await fs.writeFile(filePath, buffer)
    
    // Return relative path from public/
    const relativePath = consoleSlug 
      ? `/games/${gameSlug}-${consoleSlug}/${mediaType}/${region}/${fileName}`
      : `/games/${gameSlug}/${mediaType}/${region}/${fileName}`
    
    return relativePath
    
  } catch (error) {
    console.error(`Erreur téléchargement média ${url}:`, error)
    return null
  }
}

/**
 * Récupère les détails d'un jeu depuis Screenscraper
 */
export async function getGameDetails(gameId: number, systemId?: number): Promise<ScreenscraperGame | null> {
  try {
    const devId = process.env.SCREENSCRAPER_DEV_ID
    const devPassword = process.env.SCREENSCRAPER_DEV_PASSWORD
    
    if (!devId || !devPassword) {
      console.error('Identifiants Screenscraper manquants')
      return null
    }
    
    // Build URL with optional system ID for better accuracy
    let url = `https://api.screenscraper.fr/api2/jeuInfos.php?devid=${devId}&devpassword=${devPassword}&softname=super-retrogamers&output=json&gameid=${gameId}`
    
    if (systemId) {
      url += `&systemeid=${systemId}`
    }
    
    console.log(`Récupération du jeu ${gameId}${systemId ? ` (système ${systemId})` : ''}`)
    
    const response = await rateLimitedFetch(url)
    
    if (!response.ok) {
      console.error(`Erreur API pour le jeu ${gameId}: ${response.status}`)
      return null
    }
    
    const data = await response.json()
    
    // Debug : afficher plus de détails sur la réponse
    if (gameId <= 5) { // Pour les premiers jeux seulement
      console.log(`🔍 DEBUG - Jeu ${gameId} - Réponse complète:`)
      console.log(JSON.stringify(data, null, 2))
    }
    
    if (!data.response || !data.response.jeu) {
      console.error(`Données manquantes pour le jeu ${gameId}`)
      console.log('Structure de réponse:', JSON.stringify(data, null, 2))
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
    // Mais on va traiter plus que nécessaire pour trouver de vrais jeux (notgame: false)
    const targetCount = limit || gameIds.length
    console.log(`Recherche de ${targetCount} jeux valides sur ${gameIds.length} disponibles`)
    
    let processedCount = 0
    let createdCount = 0
    let gameIndex = 0
    
    // Continue jusqu'à avoir le nombre souhaité de jeux créés OU avoir traité tous les jeux
    while (createdCount < targetCount && gameIndex < gameIds.length) {
      const gameId = gameIds[gameIndex]
      gameIndex++
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
          createdCount++ // Compte comme "créé" puisqu'il existe déjà
          continue
        }
        
        // Récupérer les détails du jeu
        const gameDetails = await getGameDetails(gameId, systemId)
        
        if (!gameDetails) {
          console.log(`Impossible de récupérer les détails du jeu ${gameId}`)
          processedCount++
          continue
        }
        
        // Créer le jeu avec toutes ses données
        const createdGame = await createGameFromScreenscraper(gameDetails, gameConsole)
        
        if (createdGame) {
          console.log(`✅ Jeu créé: ${createdGame.title} (${createdGame.slug})`)
          createdCount++
        } else {
          console.log(`❌ Échec création du jeu ${gameId}`)
        }
        
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
    console.log(`   - Jeux ignorés (notgame/clone/erreur): ${processedCount - createdCount}`)
    console.log(`   - Objectif atteint: ${createdCount >= targetCount ? '✅' : '❌'}`)
    
  } catch (error) {
    console.error('Erreur lors du scraping des jeux:', error)
    throw error
  }
}