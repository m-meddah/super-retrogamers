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
    'Microsoft': 'Microsoft'}
  
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

// Interface pour les médias traités (utilisée pour typage interne)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      where: { ssConsoleId: system.id }
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
    
    // Créer la console
    const createdConsole = await prisma.console.create({
      data: {
        name: mainName,
        slug,
        description: `Console ${mainName} développée par ${manufacturer}. Type: ${system.type || 'Console'}.`,
        manufacturer,
        releaseYear,
        ssConsoleId: system.id}
    })
    
    // Traiter les médias avec le système de cache d'URLs
    console.log(`Traitement des médias pour ${mainName}...`)
    const mediaCount = await this.processSystemMedias(system, createdConsole.id)
    
    console.log(`✅ ${mediaCount} médias mis en cache pour ${mainName}`)
    
    return { 
      name: mainName, 
      mediaCount: mediaCount
    }
  }

  async syncSingleGame(gameId: number, consoleId?: number | string): Promise<{ name: string, mediaCount: number }> {
    const devId = process.env.SCREENSCRAPER_DEV_ID
    const devPassword = process.env.SCREENSCRAPER_DEV_PASSWORD
    
    if (!devId || !devPassword) {
      throw new Error('Identifiants Screenscraper manquants')
    }
    
    let gameConsole = null
    
    // Si un consoleId est fourni, vérifier qu'elle existe dans notre base
    if (consoleId) {
      // S'assurer que consoleId est bien un entier
      const consoleIdInt = typeof consoleId === 'string' ? parseInt(consoleId) : consoleId
      
      gameConsole = await prisma.console.findUnique({
        where: { ssConsoleId: consoleIdInt }
      })
      
      if (!gameConsole) {
        throw new Error(`Console avec ID ${consoleId} non trouvée dans la base`)
      }
    }
    
    // Construire l'URL avec ou sans restriction de console
    const baseUrl = `https://api.screenscraper.fr/api2/jeuInfos.php?devid=${devId}&devpassword=${devPassword}&output=json&gameid=${gameId}`
    const url = consoleId ? `${baseUrl}&systemeid=${typeof consoleId === 'string' ? parseInt(consoleId) : consoleId}` : baseUrl
    
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
        where: { ssConsoleId: parseInt(game.systeme.id) }
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
        ssGameId: gameId,
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

  // Méthodes pour traiter les médias avec cache d'URLs
  async processSystemMedias(system: ScreenscraperSystem, consoleId: string): Promise<number> {
    if (!system?.medias) {
      console.log(`Aucun média trouvé pour le système ${system.id}`)
      return 0
    }
    
    console.log(`Traitement de ${system.medias.length} médias pour la console ${consoleId}`)
    
    const { setCachedMediaUrl } = await import('@/lib/media-url-cache')
    let mediaCount = 0
    
    for (const media of system.medias) {
      if (this.shouldExcludeMedia(media)) {
        console.log(`Média exclu: ${media.type} (${media.region})`)
        continue
      }
      
      try {
        const safeRegion = media.region && media.region.trim() ? media.region.trim() : 'unknown'
        
        // Sauvegarder l'URL dans le cache au lieu de télécharger
        await setCachedMediaUrl('console', consoleId, media.type, safeRegion, media.url)
        
        console.log(`Cache HIT: console/${consoleId}/${media.type}/${safeRegion} -> ${media.url}`)
        mediaCount++
      } catch (error) {
        console.error(`Erreur lors de la mise en cache du média ${media.type}:`, error)
      }
    }
    
    return mediaCount
  }

  shouldExcludeMedia(media: { type: string; url: string; region: string; format: string }): boolean {
    // Types de médias à exclure (correspondance exacte)
    const excludedTypes = [
      'box3D', 
      'support2D',
      'background',
      'steam-grid'
    ]
    
    // Mots-clés à exclure dans les types de médias (correspondance partielle)
    const excludedKeywords = [
      'vierge',
      'controls',
      'bezel',
      'video',
      'gabarit'
    ]
    
    // Régions à exclure
    const excludedRegions = [
      'cus',
      'br'
    ]
    
    // Vérifier les types exacts
    if (excludedTypes.includes(media.type)) {
      return true
    }
    
    // Vérifier les mots-clés contenus dans le type
    if (excludedKeywords.some(keyword => media.type.toLowerCase().includes(keyword))) {
      return true
    }
    
    // Vérifier les régions exclues
    if (media.region && excludedRegions.includes(media.region.toLowerCase())) {
      return true
    }
    
    return false
  }

  // Cette fonction n'est plus utilisée avec le système de cache d'URLs
  // Elle est conservée temporairement pour la compatibilité
  async downloadMediaWithStructure(
    url: string
  ): Promise<string | null> {
    console.warn('downloadMediaWithStructure est obsolète, utilisation du cache d\'URLs')
    // Retourner directement l'URL Screenscraper
    return url
  }
}

export function getScreenscraperService(): ScreenscraperService {
  return new ScreenscraperService()
}