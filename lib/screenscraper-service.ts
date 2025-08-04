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
  'Autres'
]

// Types de médias à exclure
const EXCLUDED_MEDIA_TYPES = [
  'bezels'
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
  'cus'
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
    .replace(/[^\w\s-]/g, '') // Supprimer les caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
    .replace(/--+/g, '-') // Remplacer les tirets multiples par un seul
    .trim()
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

function shouldExcludeSystem(system: ScreenscraperSystem): boolean {
  // Exclure les systèmes par type
  if (system.type && EXCLUDED_SYSTEM_TYPES.includes(system.type)) {
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

async function processSystemMedias(system: ScreenscraperSystem, slug: string): Promise<ProcessedMedia[]> {
  if (!system.medias) return []
  
  const processedMedias: ProcessedMedia[] = []
  
  for (const media of system.medias) {
    if (shouldExcludeMedia(media)) {
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
          console.log(`Système ${system.id} exclu (type: ${system.type})`)
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
            image: mainImagePath,
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