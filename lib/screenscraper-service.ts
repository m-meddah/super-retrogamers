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

interface ScreenscraperResponse {
  response: {
    systemes: ScreenscraperSystem[]
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

async function downloadImage(imageUrl: string, fileName: string, folderName: string): Promise<string | null> {
  try {
    // Créer le dossier s'il n'existe pas
    const folderPath = path.join(process.cwd(), 'public', 'consoles', folderName)
    await fs.mkdir(folderPath, { recursive: true })
    
    // Télécharger l'image
    const response = await rateLimitedFetch(imageUrl)
    if (!response.ok) {
      console.error(`Erreur téléchargement image: ${response.status}`)
      return null
    }
    
    const buffer = await response.arrayBuffer()
    const filePath = path.join(folderPath, fileName)
    
    await fs.writeFile(filePath, Buffer.from(buffer))
    
    // Retourner le chemin relatif pour la base de données
    return `/consoles/${folderName}/${fileName}`
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'image:', error)
    return null
  }
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
        
        // Filtrer les consoles contenant "hack"
        if (mainName.toLowerCase().includes('hack')) {
          console.log(`Console ${mainName} ignorée (contient 'hack')`)
          processedCount++
          continue
        }
        
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
        // Si pas de date ou date invalide, mettre null plutôt qu'année actuelle
        const releaseYear = system.datedebut && parseInt(system.datedebut) > 1970 && parseInt(system.datedebut) < 2024 
          ? parseInt(system.datedebut) 
          : null
        
        // Télécharger l'image principale (priorité logo-svg)
        let imagePath: string | null = null
        if (system.medias && system.medias.length > 0) {
          // Priorité : logo-svg > wheel > photo > illustration
          const logoSvg = system.medias.find(m => m.type === 'logo-svg')
          const wheel = system.medias.find(m => m.type === 'wheel')
          const photo = system.medias.find(m => m.type === 'photo')
          const illustration = system.medias.find(m => m.type === 'illustration')
          
          const imageToDownload = logoSvg || wheel || photo || illustration
          if (imageToDownload) {
            const extension = imageToDownload.format || 'png'
            const fileName = `${system.id}.${extension}`
            imagePath = await downloadImage(imageToDownload.url, fileName, slug)
          }
        }
        
        // Créer la console en base
        await prisma.console.create({
          data: {
            slug,
            name: mainName,
            manufacturer,
            releaseYear,
            description: `Console ${mainName} développée par ${manufacturer}. Type: ${system.type || 'Console'}. Support: ${system.supporttype || 'Cartouche'}.`,
            image: imagePath,
            screenscrapeId: system.id,
          }
        })
        
        consolesAdded++
        console.log(`Console ajoutée: ${mainName} (${system.id})`)
        
        // Incrémenter le compteur de consoles traitées
        processedCount++
        
        // Rate limiting entre chaque console
        await new Promise(resolve => setTimeout(resolve, 500))
        
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