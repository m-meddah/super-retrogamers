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
  medias?: Array<{ type: string; url: string }>
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
    
    // Créer la console
    await prisma.console.create({
      data: {
        name: mainName,
        slug,
        description: `Console de jeu ${mainName}`,
        manufacturer,
        releaseYear,
        screenscrapeId: system.id,
      }
    })
    
    return { 
      name: mainName, 
      mediaCount: system.medias?.length || 0
    }
  }

  async syncSingleGame(gameId: number, consoleId: number): Promise<{ name: string, mediaCount: number }> {
    const devId = process.env.SCREENSCRAPER_DEV_ID
    const devPassword = process.env.SCREENSCRAPER_DEV_PASSWORD
    
    if (!devId || !devPassword) {
      throw new Error('Identifiants Screenscraper manquants')
    }
    
    // Vérifier que la console existe dans notre base
    const gameConsole = await prisma.console.findUnique({
      where: { screenscrapeId: consoleId }
    })
    
    if (!gameConsole) {
      throw new Error(`Console avec ID ${consoleId} non trouvée dans la base`)
    }
    
    const url = `https://api.screenscraper.fr/api2/jeuInfos.php?devid=${devId}&devpassword=${devPassword}&output=json&gameid=${gameId}&systemeid=${consoleId}`
    
    console.log(`Scraping jeu ID: ${gameId} pour console ID: ${consoleId}`)
    const response = await rateLimitedFetch(url)
    
    if (!response.ok) {
      throw new Error(`Erreur API Screenscraper: ${response.status}`)
    }
    
    const data = await response.json()
    const game = data.response?.jeu
    
    if (!game) {
      throw new Error(`Jeu avec ID ${gameId} non trouvé`)
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
      throw new Error('Impossible de créer le jeu')
    }
    
    return { 
      name: createdGame.title, 
      mediaCount: 0  // TODO: compter les médias réels
    }
  }
}

export function getScreenscraperService(): ScreenscraperService {
  return new ScreenscraperService()
}