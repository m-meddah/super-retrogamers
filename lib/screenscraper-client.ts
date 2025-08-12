import { prisma } from '@/lib/prisma'

// Fonction utilitaire pour le rate limiting
async function rateLimitedFetch(url: string, delay: number = 1200): Promise<Response> {
  await new Promise(resolve => setTimeout(resolve, delay))
  return fetch(url)
}

// Fonctions utilitaires existantes
function getMainName(noms: Record<string, string> | undefined): string {
  return noms?.nom_eu || noms?.nom_us || noms?.nom_recalbox || noms?.nom_retropie || noms?.nom_launchbox || 'Nom inconnu'
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function getManufacturer(compagnie?: string): string {
  if (!compagnie) return 'Inconnu'
  
  const manufacturers: { [key: string]: string } = {
    'Nintendo': 'Nintendo',
    'Sony': 'Sony',
    'Sega': 'Sega',
    'Atari': 'Atari',
    'SNK': 'SNK',
    'NEC': 'NEC',
    'Commodore': 'Commodore',
    'Microsoft': 'Microsoft',
  }
  
  for (const [key, value] of Object.entries(manufacturers)) {
    if (compagnie.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }
  
  return compagnie
}

interface ScreenscraperSystem {
  id: number
  noms?: Record<string, string>
  compagnie?: string
  datedebut?: string
  type?: string
  medias?: Array<{
    type: string
    url: string
    region: string
    format: string
  }>
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

export class ScreenscraperService {
  async syncSingleConsole(consoleId: number): Promise<{ name: string, mediaCount: number }> {
    const devId = process.env.SCREENSCRAPER_DEV_ID
    const devPassword = process.env.SCREENSCRAPER_DEV_PASSWORD
    
    if (!devId || !devPassword) {
      throw new Error('Identifiants Screenscraper manquants')
    }
    
    const url = `https://api.screenscraper.fr/api2/systemesListe.php?devid=${devId}&devpassword=${devPassword}&output=json`
    
    console.log(`Scraping console ID: ${consoleId}`)
    const response = await rateLimitedFetch(url)
    
    if (!response.ok) {
      throw new Error(`Erreur API Screenscraper: ${response.status}`)
    }
    
    const data: ScreenscraperResponse = await response.json()
    const system = data.response?.systemes?.find(s => s.id === consoleId)
    
    if (!system) {
      throw new Error(`Console avec ID ${consoleId} non trouvée`)
    }
    
    // Vérifier si la console existe déjà
    const existingConsole = await prisma.console.findUnique({
      where: { screenscrapeId: system.id }
    })
    
    if (existingConsole) {
      return { 
        name: existingConsole.name, 
        mediaCount: 0 
      }
    }
    
    const mainName = getMainName(system.noms)
    const slug = generateSlug(mainName)
    const manufacturer = getManufacturer(system.compagnie)
    const releaseYear = system.datedebut && parseInt(system.datedebut) > 1970 && parseInt(system.datedebut) < 2024 
      ? parseInt(system.datedebut) 
      : null
    
    // Traiter les médias AVANT de créer la console
    console.log(`Traitement des médias pour ${mainName}...`)
    const processedMedias = await this.processSystemMedias(system, slug)
    
    // Sélectionner l'image principale parmi les médias traités
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
    
    // Créer la console avec l'image principale
    const createdConsole = await prisma.console.create({
      data: {
        name: mainName,
        slug,
        description: `Console ${mainName} développée par ${manufacturer}. Type: ${system.type || 'Console'}.`,
        manufacturer,
        releaseYear,
        screenscrapeId: system.id,
        image: mainImagePath,
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
      
      console.log(`✅ ${processedMedias.length} médias sauvegardés pour ${mainName}`)
    }
    
    return { 
      name: mainName, 
      mediaCount: processedMedias.length
    }
  }

  async syncSingleGame(gameId: number, consoleId?: number): Promise<{ name: string, mediaCount: number }> {
    const devId = process.env.SCREENSCRAPER_DEV_ID
    const devPassword = process.env.SCREENSCRAPER_DEV_PASSWORD
    
    if (!devId || !devPassword) {
      throw new Error('Identifiants Screenscraper manquants')
    }
    
    let gameConsole = null
    
    // Si un consoleId est fourni, vérifier qu'elle existe dans notre base
    if (consoleId) {
      gameConsole = await prisma.console.findUnique({
        where: { screenscrapeId: consoleId }
      })
      
      if (!gameConsole) {
        throw new Error(`Console avec ID ${consoleId} non trouvée dans la base`)
      }
    }
    
    // Construire l'URL avec ou sans restriction de console
    const baseUrl = `https://api.screenscraper.fr/api2/jeuInfos.php?devid=${devId}&devpassword=${devPassword}&output=json&gameid=${gameId}`
    const url = consoleId ? `${baseUrl}&systemeid=${consoleId}` : baseUrl
    
    console.log(`Scraping jeu ID: ${gameId}${consoleId ? ` pour console ID: ${consoleId}` : ' (toutes consoles)'}`)
    const response = await rateLimitedFetch(url)
    
    if (!response.ok) {
      throw new Error(`Erreur API Screenscraper: ${response.status}`)
    }
    
    const data = await response.json()
    const game = data.response?.jeu
    
    if (!game) {
      throw new Error(`Jeu avec ID ${gameId} non trouvé`)
    }
    
    // Si aucune console spécifiée, essayer de trouver/créer la console du jeu
    if (!gameConsole && game.systeme?.id) {
      gameConsole = await prisma.console.findUnique({
        where: { screenscrapeId: parseInt(game.systeme.id) }
      })
      
      // Si la console n'existe pas dans notre base, on ne peut pas créer le jeu
      if (!gameConsole) {
        throw new Error(`La console du jeu (ID: ${game.systeme.id}) n'existe pas dans la base. Veuillez d'abord scraper cette console.`)
      }
    }
    
    if (!gameConsole) {
      throw new Error('Impossible de déterminer la console pour ce jeu')
    }
    
    // Vérifier si le jeu existe déjà pour cette console
    const existingGame = await prisma.game.findFirst({
      where: { 
        screenscrapeId: gameId,
        consoleId: gameConsole.id
      }
    })
    
    if (existingGame) {
      return { 
        name: existingGame.title, 
        mediaCount: 0 
      }
    }
    
    // Utiliser la fonction améliorée pour créer le jeu
    const { createGameFromScreenscraper } = await import('@/lib/screenscraper-games')
    const createdGame = await createGameFromScreenscraper(game, gameConsole)
    
    if (!createdGame) {
      // Si le jeu n'est pas créé (notgame = true, ou autre raison), on l'indique clairement
      const gameName = game.noms?.nom_eu || game.noms?.nom_us || game.noms?.nom_ss || `Jeu ID ${gameId}`
      throw new Error(`Le jeu "${gameName}" n'a pas pu être créé (probablement marqué comme "not game" par Screenscraper)`)
    }
    
    return { 
      name: createdGame.title, 
      mediaCount: 0  // TODO: compter les médias réels
    }
  }

  // Méthodes pour traiter les médias
  async processSystemMedias(system: ScreenscraperSystem, slug: string): Promise<ProcessedMedia[]> {
    if (!system?.medias) {
      console.log(`Aucun média trouvé pour le système ${system.id}`)
      return []
    }
    
    const processedMedias: ProcessedMedia[] = []
    
    console.log(`Traitement de ${system.medias.length} médias pour ${slug}`)
    
    for (const media of system.medias) {
      if (this.shouldExcludeMedia(media)) {
        console.log(`Média exclu: ${media.type} (${media.region})`)
        continue
      }
      
      try {
        const extension = media.format || 'png'
        const fileName = `${system.id}_${media.type}_${media.region}.${extension}`
        const localPath = await this.downloadMediaWithStructure(media.url, fileName, slug, media.type, media.region)
        
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

  shouldExcludeMedia(media: { type: string; url: string; region: string; format: string }): boolean {
    const excludedTypes = ['box3D', 'support2D']
    return excludedTypes.includes(media.type)
  }

  async downloadMediaWithStructure(
    url: string, 
    fileName: string, 
    slug: string, 
    mediaType: string, 
    region: string
  ): Promise<string | null> {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      
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
}

export function getScreenscraperService(): ScreenscraperService {
  return new ScreenscraperService()
}