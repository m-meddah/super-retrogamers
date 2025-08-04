import { getScreenscraperAPI, type ScreenscraperSystem, type ScreenscraperGame } from './screenscraper'
import { prisma } from './prisma'

interface ScrapeConsoleResult {
  success: boolean
  message?: string
  consoleId?: string
  error?: string
}

interface ScrapeGameResult {
  success: boolean
  message?: string
  gameId?: string
  error?: string
}

interface ScrapeProgress {
  current: number
  total: number
  processed: number
  errors: number
  lastProcessed?: string
}

class ScreenscraperScraper {
  private api = getScreenscraperAPI()

  // Mapping des systèmes Screenscraper vers nos données
  private readonly PRIORITY_SYSTEMS = [
    { id: 3, name: 'Nintendo Entertainment System' },
    { id: 4, name: 'Super Nintendo Entertainment System' },
    { id: 9, name: 'Game Boy' },
    { id: 10, name: 'Game Boy Color' },
    { id: 12, name: 'Game Boy Advance' },
    { id: 1, name: 'Sega Genesis' },
    { id: 2, name: 'Sega Master System' },
    { id: 14, name: 'Nintendo 64' },
    { id: 57, name: 'Sony PlayStation' },
    { id: 58, name: 'Sony PlayStation 2' },
    { id: 26, name: 'Atari 2600' },
    { id: 43, name: 'Atari 7800' },
    { id: 70, name: 'SNK Neo Geo' },
    { id: 75, name: 'Arcade' },
  ]

  async scrapeAllSystems(): Promise<{
    total: number
    imported: number
    errors: string[]
  }> {
    console.log('🚀 Début du scraping des systèmes Screenscraper...')
    
    const systems = await this.api.getSystemList()
    const errors: string[] = []
    let imported = 0

    console.log(`📊 ${systems.length} systèmes trouvés sur Screenscraper`)

    for (const system of systems) {
      try {
        const result = await this.importConsole(system)
        if (result.success) {
          imported++
          console.log(`✅ ${system.nom} importé`)
        } else {
          errors.push(`${system.nom}: ${result.error}`)
          console.log(`❌ Erreur pour ${system.nom}: ${result.error}`)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue'
        errors.push(`${system.nom}: ${errorMsg}`)
        console.log(`❌ Exception pour ${system.nom}: ${errorMsg}`)
      }
    }

    console.log(`🎯 Import terminé: ${imported}/${systems.length} systèmes importés`)
    return { total: systems.length, imported, errors }
  }

  async scrapePrioritySystems(): Promise<{
    total: number
    imported: number
    errors: string[]
  }> {
    console.log('🚀 Début du scraping des systèmes prioritaires...')
    
    const allSystems = await this.api.getSystemList()
    const prioritySystems = allSystems.filter(system => 
      this.PRIORITY_SYSTEMS.some(p => p.id.toString() === system.id)
    )
    
    const errors: string[] = []
    let imported = 0

    console.log(`📊 ${prioritySystems.length} systèmes prioritaires trouvés`)

    for (const system of prioritySystems) {
      try {
        const result = await this.importConsole(system)
        if (result.success) {
          imported++
          console.log(`✅ ${system.nom} importé`)
        } else {
          errors.push(`${system.nom}: ${result.error}`)
          console.log(`❌ Erreur pour ${system.nom}: ${result.error}`)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue'
        errors.push(`${system.nom}: ${errorMsg}`)
        console.log(`❌ Exception pour ${system.nom}: ${errorMsg}`)
      }
    }

    console.log(`🎯 Import terminé: ${imported}/${prioritySystems.length} systèmes prioritaires importés`)
    return { total: prioritySystems.length, imported, errors }
  }

  private async importConsole(system: ScreenscraperSystem): Promise<ScrapeConsoleResult> {
    try {
      // Vérifier si la console existe déjà
      const existing = await prisma.console.findFirst({
        where: { screenscrapeId: parseInt(system.id) }
      })

      if (existing) {
        return {
          success: true,
          message: 'Console déjà existante',
          consoleId: existing.id
        }
      }

      // Créer le slug
      const slug = this.createSlug(system.nom)

      // Vérifier l'unicité du slug
      const existingSlug = await prisma.console.findUnique({
        where: { slug }
      })

      if (existingSlug) {
        return {
          success: false,
          error: `Slug '${slug}' déjà utilisé`
        }
      }

      // Extraire l'année de release du texte de description
      const releaseYear = this.extractReleaseYear(system.text || '')

      // Créer la console
      const console = await prisma.console.create({
        data: {
          slug,
          name: system.nom,
          manufacturer: system.constructeur || 'Inconnu',
          releaseYear: releaseYear || 1980,
          description: system.text || '',
          screenscrapeId: parseInt(system.id),
          image: this.getSystemImage(system),
          // Champs techniques par défaut (à enrichir plus tard)
          cpu: null,
          memory: null,
          graphics: null,
        }
      })

      return {
        success: true,
        message: 'Console importée avec succès',
        consoleId: console.id
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }

  async scrapeGamesForSystem(systemId: number, maxGames = 100): Promise<{
    total: number
    imported: number
    errors: string[]
  }> {
    console.log(`🎮 Début du scraping des jeux pour le système ${systemId}...`)
    
    // Vérifier que la console existe dans notre BDD
    const gameConsole = await prisma.console.findFirst({
      where: { screenscrapeId: systemId }
    })

    if (!gameConsole) {
      throw new Error(`Console avec screenscrapeId ${systemId} non trouvée dans la base`)
    }

    const gameList = await this.api.getGameList({
      systemId,
      maxResults: maxGames,
      alphabeticalOrder: true
    })

    const errors: string[] = []
    let imported = 0

    console.log(`📊 ${gameList.length} jeux trouvés pour ${gameConsole.name}`)

    for (const gameListItem of gameList) {
      try {
        // Récupérer les détails complets du jeu
        const gameDetails = await this.api.getGameInfo({
          systemId,
          gameId: gameListItem.id,
          language: 'fr'
        })

        if (gameDetails) {
          const result = await this.importGame(gameDetails, gameConsole.id)
          if (result.success) {
            imported++
            console.log(`✅ ${gameDetails.nom} importé`)
          } else {
            errors.push(`${gameDetails.nom}: ${result.error}`)
            console.log(`❌ Erreur pour ${gameDetails.nom}: ${result.error}`)
          }
        } else {
          errors.push(`${gameListItem.nom}: Impossible de récupérer les détails`)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue'
        errors.push(`${gameListItem.nom}: ${errorMsg}`)
        console.log(`❌ Exception pour ${gameListItem.nom}: ${errorMsg}`)
      }
    }

    console.log(`🎯 Import terminé: ${imported}/${gameList.length} jeux importés pour ${gameConsole.name}`)
    return { total: gameList.length, imported, errors }
  }

  private async importGame(game: ScreenscraperGame, consoleId: string): Promise<ScrapeGameResult> {
    try {
      // Vérifier si le jeu existe déjà
      const existing = await prisma.game.findFirst({
        where: { screenscrapeId: parseInt(game.id) }
      })

      if (existing) {
        return {
          success: true,
          message: 'Jeu déjà existant',
          gameId: existing.id
        }
      }

      // Créer le slug
      const slug = this.createSlug(game.nom)

      // Vérifier l'unicité du slug
      const existingSlug = await prisma.game.findUnique({
        where: { slug }
      })

      if (existingSlug) {
        return {
          success: false,
          error: `Slug '${slug}' déjà utilisé`
        }
      }

      // Extraire les genres
      const genres = game.genres?.map(g => g.nom).join(', ') || null

      // Récupérer les screenshots
      const screenshots = this.getGameScreenshots(game)

      // Créer le jeu
      const gameRecord = await prisma.game.create({
        data: {
          slug,
          title: game.nom,
          consoleId,
          genre: genres,
          developer: game.developpeur || null,
          publisher: game.editeur || null,
          description: game.description || null,
          screenscrapeId: parseInt(game.id),
          image: this.getGameImage(game),
          screenshots,
          rating: game.note ? parseFloat(game.note) : 0,
        }
      })

      return {
        success: true,
        message: 'Jeu importé avec succès',
        gameId: gameRecord.id
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }

  private createSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces et tirets
      .replace(/\s+/g, '-') // Remplacer espaces par tirets
      .replace(/-+/g, '-') // Éviter tirets multiples
      .replace(/^-|-$/g, '') // Supprimer tirets en début/fin
  }

  private extractReleaseYear(text: string): number | null {
    const yearMatch = text.match(/\b(19|20)\d{2}\b/)
    return yearMatch ? parseInt(yearMatch[0]) : null
  }

  private getSystemImage(system: ScreenscraperSystem): string | null {
    // Chercher une image de console ou logo
    const logoMedia = system.medias?.find(m => 
      m.type.includes('logo') || m.type.includes('console')
    )
    return logoMedia?.url || null
  }

  private getGameImage(game: ScreenscraperGame): string | null {
    // Chercher box art ou screenshot principal
    const boxArt = game.medias?.find(m => 
      m.type.includes('box') || m.type.includes('cover')
    )
    return boxArt?.url || null
  }

  private getGameScreenshots(game: ScreenscraperGame): string[] {
    // Récupérer tous les screenshots
    const screenshots = game.medias?.filter(m => 
      m.type.includes('screenshot') || m.type.includes('screen')
    ).map(m => m.url) || []
    
    return screenshots
  }
}

// Instance singleton
let scraper: ScreenscraperScraper | null = null

export function getScreenscraperScraper(): ScreenscraperScraper {
  if (!scraper) {
    scraper = new ScreenscraperScraper()
  }
  return scraper
}

export { ScreenscraperScraper }
export type { ScrapeConsoleResult, ScrapeGameResult, ScrapeProgress }