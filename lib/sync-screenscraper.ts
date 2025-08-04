import { prisma } from "@/lib/prisma"
import { getScreenscraperAPI, ScreenscraperAPI } from "@/lib/screenscraper"

interface ConsoleMappingEntry {
  name: string
  slug: string
  screenscrapeSystemId: number
  manufacturer: string
}

// Mapping des consoles avec leurs IDs Screenscraper
const CONSOLE_MAPPINGS: ConsoleMappingEntry[] = [
  {
    name: "Nintendo Entertainment System",
    slug: "nes",
    screenscrapeSystemId: ScreenscraperAPI.SYSTEM_IDS.NES,
    manufacturer: "Nintendo"
  },
  {
    name: "Super Nintendo Entertainment System", 
    slug: "snes",
    screenscrapeSystemId: ScreenscraperAPI.SYSTEM_IDS.SNES,
    manufacturer: "Nintendo"
  },
  {
    name: "Sega Genesis",
    slug: "genesis", 
    screenscrapeSystemId: ScreenscraperAPI.SYSTEM_IDS.SEGA_GENESIS,
    manufacturer: "Sega"
  },
  {
    name: "Game Boy",
    slug: "gameboy",
    screenscrapeSystemId: ScreenscraperAPI.SYSTEM_IDS.GAMEBOY,
    manufacturer: "Nintendo"
  },
  {
    name: "Game Boy Color",
    slug: "gameboy-color",
    screenscrapeSystemId: ScreenscraperAPI.SYSTEM_IDS.GAMEBOY_COLOR,
    manufacturer: "Nintendo"
  },
  {
    name: "Game Boy Advance",
    slug: "gameboy-advance", 
    screenscrapeSystemId: ScreenscraperAPI.SYSTEM_IDS.GAMEBOY_ADVANCE,
    manufacturer: "Nintendo"
  }
]

export class ScreenscraperSyncService {
  private api: ReturnType<typeof getScreenscraperAPI>

  constructor() {
    this.api = getScreenscraperAPI()
  }

  async syncConsoles(): Promise<void> {
    console.log('🎮 Synchronizing consoles with Screenscraper...')

    for (const consoleMapping of CONSOLE_MAPPINGS) {
      try {
        // Vérifier si la console existe déjà
        let gameConsole = await prisma.console.findUnique({
          where: { slug: consoleMapping.slug }
        })

        if (!gameConsole) {
          // Créer la console si elle n'existe pas
          gameConsole = await prisma.console.create({
            data: {
              slug: consoleMapping.slug,
              name: consoleMapping.name,
              manufacturer: consoleMapping.manufacturer,
              releaseYear: this.getConsoleReleaseYear(consoleMapping.slug),
              description: this.getConsoleDescription(consoleMapping.slug),
              screenscrapeId: consoleMapping.screenscrapeSystemId,
            }
          })

          console.log(`✅ Created console: ${gameConsole.name}`)
        } else if (!gameConsole.screenscrapeId) {
          // Mettre à jour avec l'ID Screenscraper si manquant
          await prisma.console.update({
            where: { id: gameConsole.id },
            data: { screenscrapeId: consoleMapping.screenscrapeSystemId }
          })

          console.log(`🔄 Updated console: ${gameConsole.name}`)
        }
      } catch (error) {
        console.error(`❌ Error syncing console ${consoleMapping.name}:`, error)
      }
    }
  }

  async syncGameForConsole(consoleSlug: string, gameNames: string[]): Promise<void> {
    console.log(`🎯 Synchronizing games for ${consoleSlug}...`)

    const gameConsole = await prisma.console.findUnique({
      where: { slug: consoleSlug }
    })

    if (!gameConsole || !gameConsole.screenscrapeId) {
      throw new Error(`Console ${consoleSlug} not found or missing Screenscraper ID`)
    }

    for (const gameName of gameNames) {
      try {
        await this.syncSingleGame(gameConsole.id, gameConsole.screenscrapeId, gameName)
      } catch (error) {
        console.error(`❌ Error syncing game ${gameName}:`, error)
      }
    }
  }

  private async syncSingleGame(consoleId: string, systemId: number, gameName: string): Promise<void> {
    // Vérifier si le jeu existe déjà
    const gameSlug = this.createSlug(gameName)
    const existingGame = await prisma.game.findUnique({
      where: { slug: gameSlug }
    })

    if (existingGame) {
      console.log(`⏭️  Game ${gameName} already exists, skipping`)
      return
    }

    // Récupérer les données depuis Screenscraper
    const gameData = await this.api.getGameInfo({
      systemId,
      romName: gameName,
      language: 'fr'
    })

    if (!gameData) {
      console.log(`⚠️  Game ${gameName} not found on Screenscraper`)
      return
    }

    // Extraire les médias
    const image = ScreenscraperAPI.getMediaByType(gameData, 'box-2D') ||
                 ScreenscraperAPI.getMediaByType(gameData, 'mixrbv1') ||
                 ScreenscraperAPI.getMediaByType(gameData, 'wheel')

    const screenshots = gameData.medias
      ?.filter(m => m.type === 'screenshots')
      .map(m => m.url) || []

    // Créer le jeu dans la base de données
    const createdGame = await prisma.game.create({
      data: {
        slug: gameSlug,
        title: gameData.nom,
        consoleId,
        releaseYear: this.extractReleaseYear(gameData.description),
        genre: ScreenscraperAPI.getGenres(gameData)[0] || null,
        developer: gameData.developpeur || null,
        publisher: gameData.editeur || null,
        description: gameData.description || null,
        image,
        screenshots,
        rating: gameData.note ? parseFloat(gameData.note) : null,
        screenscrapeId: parseInt(gameData.id)
      }
    })

    console.log(`✅ Created game: ${createdGame.title}`)
  }

  private createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  private extractReleaseYear(description?: string): number | null {
    if (!description) return null
    
    const yearMatch = description.match(/\b(19|20)\d{2}\b/)
    return yearMatch ? parseInt(yearMatch[0]) : null
  }

  private getConsoleReleaseYear(slug: string): number {
    const years: Record<string, number> = {
      'nes': 1985,
      'snes': 1991,
      'genesis': 1988,
      'gameboy': 1989,
      'gameboy-color': 1998,
      'gameboy-advance': 2001
    }
    return years[slug] || 1980
  }

  private getConsoleDescription(slug: string): string {
    const descriptions: Record<string, string> = {
      'nes': "La console qui a révolutionné le jeu vidéo à domicile et sauvé l'industrie après le crash de 1983.",
      'snes': "L'évolution naturelle de la NES avec des graphismes 16-bit et un son de qualité supérieure.",
      'genesis': "La console 16-bit de Sega qui a défié Nintendo avec des jeux plus rapides et plus agressifs.",
      'gameboy': "La console portable qui a démocratisé le jeu vidéo nomade avec une autonomie exceptionnelle.",
      'gameboy-color': "L'évolution couleur de la Game Boy qui a apporté de nouvelles possibilités de jeu.",
      'gameboy-advance': "La console portable 32-bit qui a redéfini les standards du jeu nomade."
    }
    return descriptions[slug] || "Console de jeu vidéo rétro."
  }
}

// Fonctions utilitaires pour l'utilisation dans les API routes
export async function syncConsolesFromScreenscraper(): Promise<{ success: boolean; message: string }> {
  try {
    const syncService = new ScreenscraperSyncService()
    await syncService.syncConsoles()
    return { success: true, message: 'Consoles synchronized successfully' }
  } catch (error) {
    console.error('Error syncing consoles:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function syncGamesFromScreenscraper(consoleSlug: string, gameNames: string[]): Promise<{ success: boolean; message: string }> {
  try {
    const syncService = new ScreenscraperSyncService()
    await syncService.syncGameForConsole(consoleSlug, gameNames)
    return { success: true, message: `Games synchronized successfully for ${consoleSlug}` }
  } catch (error) {
    console.error('Error syncing games:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
  }
}