'use server'

import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

interface ScreenscraperSystem {
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
  compagnie?: string
  type?: string
  datedebut?: string
  datefin?: string
  romtype?: string
  supporttype?: string
}

interface ProcessedMedia {
  type: string
  region: string
  url: string
  format: string
  fileName: string
  localPath: string
}

interface ScreenscraperResponse {
  response: {
    systemes: ScreenscraperSystem[]
  }
}

// Rate limiting: 1.2 secondes entre les requêtes
const RATE_LIMIT_MS = 1200

let lastRequestTime = 0

// Types de systèmes à exclure du scraping
const EXCLUDED_SYSTEM_TYPES = [
  'Ordinateur',
  'Machine Virtuelle', 
  'Accessoire',
  'Flipper',
  'Autres',
  'Smartphone',
  'Emulation Arcade',
  'Arcade', // Exclure les systèmes d'arcade
  'Borne d\'arcade' // Exclure les bornes d'arcade (trop spécialisées pour un site consoles rétro)
]

// Types de médias à exclure
const EXCLUDED_MEDIA_TYPES = [
  'bezels',
  'box3D',
  'support2D',
  'video',
  'introvideo',
  'gabarit',
  'steam-grid'
]

// Mots-clés à exclure dans les types de médias
const EXCLUDED_MEDIA_KEYWORDS = [
  'vierge',
  'controls',
  'background',
  'bezel',
  'texture'
]

// Régions à exclure
const EXCLUDED_REGIONS = [
  'cus',
  'br'
]

// Consoles modernes à exclure (8ème génération et +)
// Coupure en 2012 pour inclure la 7ème génération (PS3/Xbox360/Wii)
const MODERN_CONSOLE_CUTOFF_YEAR = 2012

// IDs Screenscraper des consoles modernes à exclure explicitement
const EXCLUDED_MODERN_CONSOLE_IDS = [
  // 8ème génération (2012-2017)
  219, // PlayStation 4
  220, // Xbox One  
  218, // Wii U
  227, // Nintendo 3DS (2011 mais écosystème moderne)
  
  // 9ème génération (2020+)
  226, // PlayStation 5
  225, // Xbox Series X/S
  225, // Nintendo Switch (si présent)
  
  // Consoles/appareils mobiles modernes
  221, // PlayStation Vita (2011 mais architecture moderne)
]

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


function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
}

function getMainName(noms: ScreenscraperSystem['noms']): string {
  // Priorité: nom_eu (Europe), nom_us, puis le premier disponible
  if (noms.nom_eu) return noms.nom_eu
  if (noms.nom_us) return noms.nom_us
  if (noms.nom_launchbox) return noms.nom_launchbox
  if (noms.nom_hyperspin) return noms.nom_hyperspin
  if (noms.nom_recalbox) return noms.nom_recalbox
  
  return 'Console inconnue'
}

function getManufacturer(company: string | undefined): string {
  if (!company) return 'Inconnu'
  
  // Nettoyer et standardiser les noms de fabricants
  const cleanCompany = company.trim()
  
  const manufacturers: Record<string, string> = {
    'nintendo': 'Nintendo',
    'sony': 'Sony',
    'microsoft': 'Microsoft',
    'sega': 'Sega',
    'atari': 'Atari',
    'snk': 'SNK',
    'nec': 'NEC',
    'commodore': 'Commodore',
    'amstrad': 'Amstrad',
    'sinclair': 'Sinclair',
  }
  
  const lowerCompany = cleanCompany.toLowerCase()
  return manufacturers[lowerCompany] || cleanCompany
}

function extractRegionalNames(noms: ScreenscraperSystem['noms']): Array<{ region: string, name: string }> {
  const regionalNames: Array<{ region: string, name: string }> = []
  
  // Mapping des noms Screenscraper vers nos régions
  const regionMappings: Record<string, string> = {
    'nom_eu': 'EU',
    'nom_us': 'US', 
    'nom_fr': 'FR',
    'nom_jp': 'JP',
    'nom_wor': 'WOR'
  }
  
  // Extraire tous les noms régionaux disponibles
  Object.entries(regionMappings).forEach(([screenscraperKey, region]) => {
    const name = noms[screenscraperKey as keyof typeof noms]
    if (name && name.trim()) {
      regionalNames.push({ region, name: name.trim() })
    }
  })
  
  return regionalNames
}

function extractRegionalDates(system: ScreenscraperSystem): Array<{ region: string, releaseDate: Date | null }> {
  const regionalDates: Array<{ region: string, releaseDate: Date | null }> = []
  
  // Pour les consoles, on peut essayer d'extraire des dates des descriptions ou utiliser datedebut
  if (system.datedebut) {
    const year = parseInt(system.datedebut)
    if (!isNaN(year) && year > 1970 && year < 2030) {
      // Créer une date générique pour toutes les régions
      const releaseDate = new Date(year, 0, 1)
      const regions = ['FR', 'EU', 'WOR', 'JP', 'US']
      regions.forEach(region => {
        regionalDates.push({ region, releaseDate })
      })
    }
  }
  
  return regionalDates
}

function isRetroConsole(system: ScreenscraperSystem): boolean {
  // Exclure les IDs modernes explicites
  if (EXCLUDED_MODERN_CONSOLE_IDS.includes(system.id)) {
    return false
  }
  
  // Vérifier l'année de début
  if (system.datedebut) {
    const startYear = parseInt(system.datedebut)
    if (!isNaN(startYear) && startYear > MODERN_CONSOLE_CUTOFF_YEAR) {
      return false
    }
  }
  
  return true
}

function shouldExcludeSystem(system: ScreenscraperSystem): boolean {
  // Exclure les systèmes par type
  if (system.type && EXCLUDED_SYSTEM_TYPES.includes(system.type)) {
    return true
  }
  
  // Vérifier si c'est une console moderne (non-rétro)
  if (!isRetroConsole(system)) {
    return true
  }
  
  const mainName = getMainName(system.noms).toLowerCase()
  
  // Exclure les systèmes contenant "hack"
  if (mainName.includes('hack')) {
    return true
  }
  
  return false
}

function shouldExcludeMedia(media: { type: string; region: string }): boolean {
  // Exclure les types de médias spécifiques
  if (EXCLUDED_MEDIA_TYPES.some(excludedType => media.type.includes(excludedType))) {
    return true
  }
  
  // Exclure les médias contenant des mots-clés spécifiques
  if (EXCLUDED_MEDIA_KEYWORDS.some(keyword => media.type.toLowerCase().includes(keyword))) {
    return true
  }
  
  // Exclure les régions spécifiques
  if (media.region && EXCLUDED_REGIONS.includes(media.region.toLowerCase())) {
    return true
  }
  
  return false
}

// Récupérer les détails d'un système spécifique avec ses médias
async function getSystemDetailsWithMedias(systemId: number): Promise<ScreenscraperSystem | null> {
  try {
    const devId = process.env.SCREENSCRAPER_DEV_ID
    const devPassword = process.env.SCREENSCRAPER_DEV_PASSWORD
    
    if (!devId || !devPassword) {
      console.error('Identifiants Screenscraper manquants')
      return null
    }
    
    // L'API systemesListe récupère TOUS les systèmes, pas un système spécifique
    const url = `https://api.screenscraper.fr/api2/systemesListe.php?devid=${devId}&devpassword=${devPassword}&output=json`
    
    console.log(`Récupération de tous les systèmes pour trouver l'ID ${systemId}...`)
    const response = await rateLimitedFetch(url)
    
    if (!response.ok) {
      console.error(`Erreur API Screenscraper: ${response.status}`)
      return null
    }
    
    const data: ScreenscraperResponse = await response.json()
    
    if (!data.response?.systemes || data.response.systemes.length === 0) {
      console.error('Aucun système trouvé dans la réponse Screenscraper')
      return null
    }
    
    // Chercher le système avec l'ID correspondant
    const system = data.response.systemes.find(s => s.id === systemId)
    
    if (!system) {
      console.error(`Système avec ID ${systemId} non trouvé dans les ${data.response.systemes.length} systèmes disponibles`)
      return null
    }
    
    console.log(`Système ${systemId} trouvé: ${getMainName(system.noms)} avec ${system.medias?.length || 0} médias`)
    return system
    
  } catch (error) {
    console.error(`Erreur lors de la récupération des détails du système ${systemId}:`, error)
    return null
  }
}

async function processSystemMedias(system: ScreenscraperSystem, slug: string): Promise<ProcessedMedia[]> {
  if (!system?.medias) {
    console.log(`Aucun média trouvé pour le système ${system.id}`)
    return []
  }
  
  const processedMedias: ProcessedMedia[] = []
  
  console.log(`Traitement de ${system.medias.length} médias pour ${slug}`)
  
  for (const media of system.medias) {
    if (shouldExcludeMedia(media)) {
      console.log(`Média exclu: ${media.type} (${media.region})`)
      continue
    }
    
    try {
      const extension = media.format || 'png'
      const fileName = `${system.id}_${media.type}_${media.region}.${extension}`
      const localPath = await downloadMediaWithStructure(media.url, fileName, slug, media.type, media.region)
      
      if (localPath) {
        const safeRegion = media.region && media.region.trim() ? media.region.trim() : 'unknown'
        processedMedias.push({
          type: media.type,
          region: safeRegion,
          url: media.url,
          format: extension,
          fileName,
          localPath
        })
        console.log(`Média téléchargé: ${media.type} (${safeRegion})`)
      }
    } catch (error) {
      console.error(`Erreur lors du téléchargement du média ${media.type}:`, error)
    }
  }
  
  return processedMedias
}

async function downloadMediaWithStructure(
  url: string, 
  fileName: string, 
  slug: string, 
  mediaType: string, 
  region: string
): Promise<string | null> {
  try {
    // Gérer les régions undefined ou vides
    const safeRegion = region && region.trim() ? region.trim() : 'unknown'
    
    // Créer la structure de dossiers : public/consoles/[slug]/[mediaType]/[region]/
    const consolesDir = path.join(process.cwd(), 'public', 'consoles')
    const consoleDir = path.join(consolesDir, slug)
    const mediaTypeDir = path.join(consoleDir, mediaType)
    const regionDir = path.join(mediaTypeDir, safeRegion)
    
    // Créer tous les dossiers nécessaires
    await fs.mkdir(regionDir, { recursive: true })
    
    const response = await rateLimitedFetch(url)
    if (!response.ok) {
      console.error(`Erreur lors du téléchargement de l'image ${url}: ${response.status}`)
      return null
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const filePath = path.join(regionDir, fileName)
    await fs.writeFile(filePath, buffer)
    
    // Retourner le chemin relatif depuis public/
    return `/consoles/${slug}/${mediaType}/${safeRegion}/${fileName}`
    
  } catch (error) {
    console.error(`Erreur lors du téléchargement de l'image ${url}:`, error)
    return null
  }
}

// Fonction pour re-scraper les médias d'une console existante
export async function rescrapConsoleMedias(consoleId: string): Promise<{ success: boolean, message: string, mediasAdded: number }> {
  try {
    const gameConsole = await prisma.console.findUnique({
      where: { id: consoleId }
    })
    
    if (!gameConsole) {
      return {
        success: false,
        message: 'Console non trouvée',
        mediasAdded: 0
      }
    }
    
    if (!gameConsole.screenscrapeId) {
      return {
        success: false,
        message: 'Console sans ID Screenscraper',
        mediasAdded: 0
      }
    }
    
    console.log(`Re-scraping médias pour ${gameConsole.name} (ID: ${gameConsole.screenscrapeId})`)
    
    // Récupérer les détails du système avec ses médias
    const systemDetails = await getSystemDetailsWithMedias(gameConsole.screenscrapeId)
    
    if (!systemDetails?.medias) {
      return {
        success: false,
        message: 'Aucun média trouvé sur Screenscraper',
        mediasAdded: 0
      }
    }
    
    // Traiter les médias
    const processedMedias = await processSystemMedias(systemDetails, gameConsole.slug)
    
    if (processedMedias.length === 0) {
      return {
        success: false,
        message: 'Aucun média n\'a pu être téléchargé',
        mediasAdded: 0
      }
    }
    
    // Supprimer les anciens médias
    await prisma.consoleMedia.deleteMany({
      where: { consoleId: gameConsole.id }
    })
    
    // Sauvegarder les nouveaux médias
    const mediaData = processedMedias.map(media => ({
      consoleId: gameConsole.id,
      type: media.type,
      region: media.region,
      url: media.url,
      localPath: media.localPath,
      format: media.format,
      fileName: media.fileName
    }))
    
    await prisma.consoleMedia.createMany({
      data: mediaData
    })
    
    // Mettre à jour l'image principale de la console
    let mainImagePath: string | null = null
    if (processedMedias.length > 0) {
      const priorityOrder = ['logo-svg', 'wheel', 'photo', 'illustration']
      for (const priority of priorityOrder) {
        const media = processedMedias.find(m => m.type === priority)
        if (media) {
          mainImagePath = media.localPath
          break
        }
      }
      
      if (!mainImagePath && processedMedias.length > 0) {
        mainImagePath = processedMedias[0].localPath
      }
    }
    
    // Image column removed - images now handled through regional media selection
    if (mainImagePath) {
      console.log(`📸 Main image available: ${mainImagePath} (image column removed)`)
    }
    
    return {
      success: true,
      message: `${processedMedias.length} médias récupérés`,
      mediasAdded: processedMedias.length
    }
    
  } catch (error) {
    console.error('Erreur lors du re-scraping des médias:', error)
    return {
      success: false,
      message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      mediasAdded: 0
    }
  }
}

// Fonction pour scraper les noms régionaux des consoles existantes
export async function scrapeRegionalNamesForExistingConsoles(): Promise<{ success: boolean, message: string, consolesUpdated: number }> {
  try {
    console.log('Début du scraping des noms régionaux pour les consoles existantes...')
    
    // Récupérer toutes les consoles avec un screenscrapeId
    const existingConsoles = await prisma.console.findMany({
      where: {
        screenscrapeId: {
          not: null
        }
      },
      include: {
        regionalNames: true,
        regionalDates: true
      }
    })
    
    console.log(`${existingConsoles.length} consoles trouvées avec screenscrapeId`)
    
    let consolesUpdated = 0
    
    for (const gameConsole of existingConsoles) {
      try {
        console.log(`Traitement de ${gameConsole.name} (ID Screenscraper: ${gameConsole.screenscrapeId})`)
        
        // Récupérer les détails du système depuis Screenscraper
        const systemDetails = await getSystemDetailsWithMedias(gameConsole.screenscrapeId!)
        
        if (!systemDetails) {
          console.log(`❌ Impossible de récupérer les détails pour ${gameConsole.name}`)
          continue
        }
        
        let hasUpdates = false
        
        // Traiter les noms régionaux
        const regionalNames = extractRegionalNames(systemDetails.noms)
        if (regionalNames.length > 0) {
          // Supprimer les anciens noms régionaux
          await prisma.consoleRegionalName.deleteMany({
            where: { consoleId: gameConsole.id }
          })
          
          // Ajouter les nouveaux noms régionaux
          const nameData = regionalNames.map(name => ({
            consoleId: gameConsole.id,
            region: name.region as any, // Prisma enum
            name: name.name
          }))
          
          await prisma.consoleRegionalName.createMany({
            data: nameData
          })
          
          console.log(`📝 Noms régionaux ajoutés: ${regionalNames.map(n => `${n.region}: ${n.name}`).join(', ')}`)
          hasUpdates = true
        }
        
        // Traiter les dates régionales
        const regionalDates = extractRegionalDates(systemDetails)
        if (regionalDates.length > 0) {
          // Supprimer les anciennes dates régionales
          await prisma.consoleRegionalDate.deleteMany({
            where: { consoleId: gameConsole.id }
          })
          
          // Ajouter les nouvelles dates régionales
          const dateData = regionalDates.map(date => ({
            consoleId: gameConsole.id,
            region: date.region as any, // Prisma enum
            releaseDate: date.releaseDate
          }))
          
          await prisma.consoleRegionalDate.createMany({
            data: dateData
          })
          
          console.log(`📅 Dates régionales ajoutées pour ${regionalDates.length} régions`)
          hasUpdates = true
        }
        
        if (hasUpdates) {
          consolesUpdated++
          console.log(`✅ Console ${gameConsole.name} mise à jour avec les données régionales`)
        }
        
        // Rate limiting entre chaque console
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`Erreur lors du traitement de ${gameConsole.name}:`, error)
        continue
      }
    }
    
    return {
      success: true,
      message: `Scraping terminé: ${consolesUpdated} consoles mises à jour`,
      consolesUpdated
    }
    
  } catch (error) {
    console.error('Erreur lors du scraping des noms régionaux:', error)
    return {
      success: false,
      message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      consolesUpdated: 0
    }
  }
}

export async function scrapeConsolesFromScreenscraper(limit?: number): Promise<{ success: boolean, message: string, consolesAdded: number }> {
  try {
    console.log('Début du scraping des consoles depuis Screenscraper...')
    
    // Construire l'URL avec les identifiants depuis les variables d'environnement
    const devId = process.env.SCREENSCRAPER_DEV_ID
    const devPassword = process.env.SCREENSCRAPER_DEV_PASSWORD
    
    if (!devId || !devPassword) {
      return {
        success: false,
        message: 'Identifiants Screenscraper manquants',
        consolesAdded: 0
      }
    }
    
    const url = `https://api.screenscraper.fr/api2/systemesListe.php?devid=${devId}&devpassword=${devPassword}&output=json`
    
    console.log('Récupération de la liste des systèmes...')
    const response = await rateLimitedFetch(url)
    
    if (!response.ok) {
      return {
        success: false,
        message: `Erreur API Screenscraper: ${response.status}`,
        consolesAdded: 0
      }
    }
    
    const data: ScreenscraperResponse = await response.json()
    
    if (!data.response?.systemes) {
      return {
        success: false,
        message: 'Format de réponse invalide',
        consolesAdded: 0
      }
    }
    
    console.log(`${data.response.systemes.length} systèmes trouvés`)
    
    let consolesAdded = 0
    let processedCount = 0
    
    for (const system of data.response.systemes) {
      // Si une limite est définie, arrêter après avoir traité le nombre requis
      if (limit && processedCount >= limit) {
        break
      }
      
      try {
        // Vérifier si le système doit être exclu
        if (shouldExcludeSystem(system)) {
          let reason = `type: ${system.type}`
          if (!isRetroConsole(system)) {
            const year = system.datedebut ? parseInt(system.datedebut) : 'inconnue'
            reason += `, moderne (${year})`
          }
          console.log(`🚫 Système ${system.id} (${getMainName(system.noms)}) exclu - ${reason}`)
          processedCount++
          continue
        }
        
        // Vérifier si la console existe déjà
        const existingConsole = await prisma.console.findUnique({
          where: { screenscrapeId: system.id }
        })
        
        if (existingConsole) {
          console.log(`Console ${system.id} déjà existante, ignorée`)
          processedCount++
          continue
        }
        
        const mainName = getMainName(system.noms)
        const slug = generateSlug(mainName)
        
        // Vérifier si le slug existe déjà
        const existingSlug = await prisma.console.findUnique({
          where: { slug }
        })
        
        if (existingSlug) {
          console.log(`Slug ${slug} déjà existant, ignoré`)
          processedCount++
          continue
        }
        
        const manufacturer = getManufacturer(system.compagnie)
        const releaseYear = system.datedebut && parseInt(system.datedebut) > 1970 && parseInt(system.datedebut) < 2024 
          ? parseInt(system.datedebut) 
          : null
        
        // Traiter tous les médias avec la nouvelle structure
        console.log(`Traitement des médias pour ${mainName}...`)
        const processedMedias = await processSystemMedias(system, slug)
        
        // Sélectionner l'image principale parmi les médias traités
        let mainImagePath: string | null = null
        if (processedMedias.length > 0) {
          // Priorité : logo-svg > wheel > photo > illustration
          const priorityOrder = ['logo-svg', 'wheel', 'photo', 'illustration']
          for (const priority of priorityOrder) {
            const media = processedMedias.find(m => m.type === priority)
            if (media) {
              mainImagePath = media.localPath
              break
            }
          }
          
          // Si aucune priorité trouvée, prendre le premier média disponible
          if (!mainImagePath && processedMedias.length > 0) {
            mainImagePath = processedMedias[0].localPath
          }
        }
        
        // Créer la console en base
        const createdConsole = await prisma.console.create({
          data: {
            slug,
            name: mainName,
            manufacturer,
            releaseYear,
            description: `Console ${mainName} développée par ${manufacturer}. Type: ${system.type || 'Console'}. Support: ${system.supporttype || 'Cartouche'}.`,
            screenscrapeId: system.id,
          }
        })
        
        // Sauvegarder tous les médias en base de données
        if (processedMedias.length > 0) {
          const mediaData = processedMedias.map(media => ({
            consoleId: createdConsole.id,
            type: media.type,
            region: media.region,
            url: media.url,
            localPath: media.localPath,
            format: media.format,
            fileName: media.fileName
          }))
          
          await prisma.consoleMedia.createMany({
            data: mediaData
          })
        }

        // Sauvegarder les noms régionaux
        const regionalNames = extractRegionalNames(system.noms)
        if (regionalNames.length > 0) {
          const nameData = regionalNames.map(name => ({
            consoleId: createdConsole.id,
            region: name.region as any, // Prisma enum
            name: name.name
          }))
          
          await prisma.consoleRegionalName.createMany({
            data: nameData
          })
          console.log(`Noms régionaux ajoutés: ${regionalNames.map(n => `${n.region}: ${n.name}`).join(', ')}`)
        }

        // Sauvegarder les dates régionales
        const regionalDates = extractRegionalDates(system)
        if (regionalDates.length > 0) {
          const dateData = regionalDates.map(date => ({
            consoleId: createdConsole.id,
            region: date.region as any, // Prisma enum
            releaseDate: date.releaseDate
          }))
          
          await prisma.consoleRegionalDate.createMany({
            data: dateData
          })
          console.log(`Dates régionales ajoutées pour ${regionalDates.length} régions`)
        }
        
        consolesAdded++
        console.log(`Console ajoutée: ${mainName} (${system.id}) avec ${processedMedias.length} médias`)
        
        processedCount++
        
        // Rate limiting entre chaque console
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`Erreur lors du traitement de la console ${system.id}:`, error)
        continue
      }
    }
    
    return {
      success: true,
      message: `Scraping terminé avec succès`,
      consolesAdded
    }
    
  } catch (error) {
    console.error('Erreur lors du scraping:', error)
    return {
      success: false,
      message: `Erreur lors du scraping: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      consolesAdded: 0
    }
  }
}

