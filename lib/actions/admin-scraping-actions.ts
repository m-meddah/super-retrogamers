'use server'

import { getScreenscraperService } from '@/lib/screenscraper-client'
import { prisma } from '@/lib/prisma'
import { scrapeConsolesFromScreenscraper, scrapeRegionalNamesForExistingConsoles } from '@/lib/screenscraper-service'
import { scrapeRegionalTitlesForExistingGames, scrapeGamesForConsole } from '@/lib/screenscraper-games'

export interface ActionState {
  success?: boolean
  error?: string
  message?: string
  data?: unknown
}

export async function getConsoleSlugByScreenscraperId(screenscrapeId: number): Promise<string | null> {
  try {
    const console = await prisma.console.findUnique({
      where: { screenscrapeId: screenscrapeId },
      select: { slug: true }
    })
    return console?.slug || null
  } catch (error) {
    console.error('Erreur lors de la récupération du slug:', error)
    return null
  }
}

export async function getAllConsolesForScraping(): Promise<Array<{id: string, name: string, slug: string, screenscrapeId: number | null}>> {
  try {
    const consoles = await prisma.console.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        screenscrapeId: true
      },
      orderBy: {
        name: 'asc'
      }
    })
    return consoles
  } catch (error) {
    console.error('Erreur lors de la récupération des consoles:', error)
    return []
  }
}

export async function scrapeSingleConsoleAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const consoleId = formData.get('consoleId') as string

    if (!consoleId?.trim()) {
      return {
        success: false,
        error: 'ID console requis'
      }
    }

    const screenscraper = getScreenscraperService()
    const result = await screenscraper.syncSingleConsole(parseInt(consoleId))

    return {
      success: true,
      message: `Console "${result.name}" scrapée avec succès`,
      data: {
        consoleName: result.name,
        mediaCount: result.mediaCount
      }
    }
  } catch (error) {
    console.error('Erreur scraping console:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du scraping de la console'
    }
  }
}

export async function scrapeSingleGameAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const gameId = formData.get('gameId') as string
    const consoleId = formData.get('consoleId') as string

    if (!gameId?.trim()) {
      return {
        success: false,
        error: 'ID jeu requis'
      }
    }

    const screenscraper = getScreenscraperService()
    const consoleIdNumber = consoleId?.trim() ? parseInt(consoleId) : undefined
    const result = await screenscraper.syncSingleGame(parseInt(gameId), consoleIdNumber)

    return {
      success: true,
      message: `Jeu "${result.name}" scrapé avec succès`,
      data: {
        gameName: result.name,
        mediaCount: result.mediaCount
      }
    }
  } catch (error) {
    console.error('Erreur scraping jeu:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du scraping du jeu'
    }
  }
}

export async function addConsoleManuallyAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    if (!name?.trim()) {
      return {
        success: false,
        error: 'Le nom de la console est requis'
      }
    }

    // Créer le slug à partir du nom
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    // Vérifier si une console avec ce slug existe déjà
    const existingConsole = await prisma.console.findUnique({
      where: { slug }
    })

    if (existingConsole) {
      return {
        success: false,
        error: 'Une console avec ce nom existe déjà'
      }
    }

    const console = await prisma.console.create({
      data: {
        name,
        slug,
        description: description || '',
        manufacturer: '',
        releaseYear: new Date().getFullYear(),
      }
    })

    return {
      success: true,
      message: `Console "${console.name}" ajoutée avec succès`,
      data: {
        name: console.name,
        slug: console.slug
      }
    }
  } catch (error) {
    console.error('Erreur création console:', error)
    return {
      success: false,
      error: 'Erreur lors de la création de la console'
    }
  }
}

export async function scrapeAllConsolesAction(): Promise<ActionState> {
  try {
    console.log('Démarrage du scraping de toutes les consoles...')
    
    const result = await scrapeConsolesFromScreenscraper()
    
    if (result.success) {
      return {
        success: true,
        message: `${result.consolesAdded} consoles ajoutées avec succès`,
        data: {
          consolesAdded: result.consolesAdded
        }
      }
    } else {
      return {
        success: false,
        error: result.message
      }
    }
  } catch (error) {
    console.error('Erreur scraping toutes consoles:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du scraping de toutes les consoles'
    }
  }
}

export async function scrapeLimitedConsolesAction(): Promise<ActionState> {
  try {
    console.log('Démarrage du scraping limité des consoles...')
    
    const result = await scrapeConsolesFromScreenscraper(10) // Limité à 10 consoles
    
    if (result.success) {
      return {
        success: true,
        message: `${result.consolesAdded} consoles ajoutées avec succès (limite: 10)`,
        data: {
          consolesAdded: result.consolesAdded
        }
      }
    } else {
      return {
        success: false,
        error: result.message
      }
    }
  } catch (error) {
    console.error('Erreur scraping limité consoles:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du scraping limité des consoles'
    }
  }
}

// Action pour scraper les noms régionaux des consoles existantes
export async function scrapeConsoleRegionalNamesAction(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: ActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData
): Promise<ActionState> {
  try {
    const result = await scrapeRegionalNamesForExistingConsoles()
    
    if (result.success) {
      return {
        success: true,
        message: `${result.message} - ${result.consolesUpdated} consoles mises à jour`,
        data: { consolesUpdated: result.consolesUpdated }
      }
    } else {
      return {
        success: false,
        error: result.message
      }
    }
  } catch (error) {
    console.error('Erreur lors du scraping des noms régionaux des consoles:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du scraping des noms régionaux'
    }
  }
}

// Action pour scraper les titres régionaux des jeux existants
export async function scrapeGameRegionalTitlesAction(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: ActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData
): Promise<ActionState> {
  try {
    const result = await scrapeRegionalTitlesForExistingGames()
    
    if (result.success) {
      return {
        success: true,
        message: `${result.message} - ${result.gamesUpdated} jeux mis à jour`,
        data: { gamesUpdated: result.gamesUpdated }
      }
    } else {
      return {
        success: false,
        error: result.message
      }
    }
  } catch (error) {
    console.error('Erreur lors du scraping des titres régionaux des jeux:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du scraping des titres régionaux'
    }
  }
}

// Action pour scraper les jeux d'une console spécifique par slug
export async function scrapeGamesForConsoleBySlugAction(
  consoleSlug: string
): Promise<ActionState> {
  try {
    // Trouver la console par slug
    const console = await prisma.console.findUnique({
      where: { slug: consoleSlug },
      select: { id: true, name: true, screenscrapeId: true }
    })

    if (!console) {
      return {
        success: false,
        error: `Console avec le slug "${consoleSlug}" non trouvée`
      }
    }

    if (!console.screenscrapeId) {
      return {
        success: false,
        error: `La console "${console.name}" n'a pas d'ID Screenscraper`
      }
    }

    // Scraper les jeux pour cette console
    await scrapeGamesForConsole(console.id, console.screenscrapeId, 50)

    // Compter les jeux scrapés
    const gamesCount = await prisma.game.count({
      where: { consoleId: console.id }
    })

    return {
      success: true,
      message: `${gamesCount} jeux traités pour ${console.name}`,
      data: {
        consoleName: console.name,
        gamesProcessed: gamesCount
      }
    }
  } catch (error) {
    console.error('Erreur scraping jeux pour console:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du scraping des jeux'
    }
  }
}

// Action pour mettre à jour le contenu éditorial d'une console
export async function updateConsoleEditorialAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const slug = formData.get('slug') as string
    const editorialTitle = formData.get('editorialTitle') as string
    const editorialAuthor = formData.get('editorialAuthor') as string
    const editorialContent = formData.get('editorialContent') as string
    const editorialPublishedAt = formData.get('editorialPublishedAt') as string

    if (!slug) {
      return {
        success: false,
        error: 'Slug de console requis'
      }
    }

    // Vérifier que la console existe
    const console = await prisma.console.findUnique({
      where: { slug }
    })

    if (!console) {
      return {
        success: false,
        error: 'Console non trouvée'
      }
    }

    // Mettre à jour le contenu éditorial
    const updatedConsole = await prisma.console.update({
      where: { slug },
      data: {
        editorialTitle: editorialTitle || null,
        editorialAuthor: editorialAuthor || null,
        editorialContent: editorialContent || null,
        editorialPublishedAt: editorialPublishedAt ? new Date(editorialPublishedAt) : null,
        updatedAt: new Date(),
      }
    })

    return {
      success: true,
      message: `Contenu éditorial mis à jour pour ${updatedConsole.name}`,
      data: {
        consoleName: updatedConsole.name,
        slug: updatedConsole.slug
      }
    }
  } catch (error) {
    console.error('Erreur mise à jour contenu éditorial:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du contenu éditorial'
    }
  }
}

// Action pour synchroniser les genres depuis Screenscraper
export async function syncGenresAction(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: ActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData
): Promise<ActionState> {
  try {
    // Récupérer les genres depuis Screenscraper avec timeout et retry
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 secondes de timeout
    
    let response: Response
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        response = await fetch('https://api.screenscraper.fr/api2/genresListe.php?devid=Fradz&devpassword=AGeJikPS7jZ&output=json', {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Super-Retrogamers-Admin/1.0'
          }
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          if (response.status >= 500 && retryCount < maxRetries - 1) {
            retryCount++
            console.log(`Erreur serveur ${response.status}, tentative ${retryCount + 1}/${maxRetries}`)
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)) // Délai progressif
            continue
          }
          throw new Error(`Erreur HTTP ${response.status} lors de la récupération des genres`)
        }
        
        break // Succès, sortir de la boucle
        
      } catch (error) {
        clearTimeout(timeoutId)
        retryCount++
        
        if (retryCount >= maxRetries) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Timeout lors de la connexion à Screenscraper (30s). Vérifiez votre connexion internet.')
          }
          throw new Error(`Impossible de se connecter à Screenscraper après ${maxRetries} tentatives: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
        }
        
        console.log(`Tentative ${retryCount} échouée, retry dans ${2000 * retryCount}ms...`)
        await new Promise(resolve => setTimeout(resolve, 2000 * retryCount))
      }
    }
    
    const data = await response.json()
    
    console.log('Structure de la réponse Screenscraper:', JSON.stringify(data, null, 2))
    
    if (!data.response?.genres) {
      throw new Error('Format de réponse invalide depuis Screenscraper: pas de genres trouvés')
    }
    
    // Vérifier si genres est un objet ou un tableau
    let genresArray: any[]
    if (Array.isArray(data.response.genres)) {
      genresArray = data.response.genres
    } else if (typeof data.response.genres === 'object') {
      // Si c'est un objet, convertir en tableau des valeurs
      genresArray = Object.values(data.response.genres)
    } else {
      throw new Error('Format de genres non supporté depuis Screenscraper')
    }
    
    console.log(`Genres trouvés: ${genresArray.length}`)
    
    let genresUpdated = 0
    let genresCreated = 0
    
    // Synchroniser chaque genre
    for (const genreData of genresArray) {
      // Gérer différentes structures de données possibles
      const genreInfo = genreData.genre || genreData
      
      if (!genreInfo || !genreInfo.id || !genreInfo.nom_fr) {
        console.log('Genre ignoré - données incomplètes:', genreInfo)
        continue
      }
      
      // Couleurs par défaut pour les genres principaux
      const colors: Record<number, string> = {
        1: '#FF6B6B',   // Action
        2: '#4ECDC4',   // Plateforme
        3: '#45B7D1',   // Sport
        4: '#FFA07A',   // Course
        5: '#98D8C8',   // Puzzle
        6: '#F7DC6F',   // Réflexion
        7: '#BB8FCE',   // Aventure
        8: '#85C1E9',   // RPG
        9: '#F8C471',   // Simulation
        10: '#82E0AA',  // Éducatif
        11: '#F1948A'   // Autre
      }
      
      const existingGenre = await prisma.genre.findUnique({
        where: { screenscrapeId: parseInt(genreInfo.id) }
      })
      
      if (existingGenre) {
        // Mettre à jour le genre existant
        await prisma.genre.update({
          where: { screenscrapeId: parseInt(genreInfo.id) },
          data: {
            name: genreInfo.nom_fr,
            parentId: genreInfo.parentid ? parseInt(genreInfo.parentid) : null,
            isMainGenre: !genreInfo.parentid || genreInfo.parentid === '0',
            color: colors[parseInt(genreInfo.id)] || null
          }
        })
        genresUpdated++
      } else {
        // Créer un nouveau genre
        await prisma.genre.create({
          data: {
            screenscrapeId: parseInt(genreInfo.id),
            name: genreInfo.nom_fr,
            parentId: genreInfo.parentid ? parseInt(genreInfo.parentid) : null,
            isMainGenre: !genreInfo.parentid || genreInfo.parentid === '0',
            color: colors[parseInt(genreInfo.id)] || null
          }
        })
        genresCreated++
      }
    }
    
    return {
      success: true,
      message: `Synchronisation des genres terminée - ${genresCreated} créés, ${genresUpdated} mis à jour`,
      data: { genresCreated, genresUpdated, totalGenres: genresArray.length }
    }
    
  } catch (error) {
    console.error('Erreur lors de la synchronisation des genres:', error)
    
    // Vérifier s'il y a déjà des genres dans la base de données
    try {
      const existingGenresCount = await prisma.genre.count()
      
      if (existingGenresCount > 0) {
        return {
          success: true,
          message: `Synchronisation Screenscraper échouée (${error instanceof Error ? error.message : 'Erreur inconnue'}), mais ${existingGenresCount} genres sont déjà disponibles dans la base de données.`
        }
      }
    } catch (dbError) {
      console.error('Erreur lors de la vérification des genres existants:', dbError)
    }
    
    return {
      success: false,
      message: `Erreur lors de la synchronisation des genres: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    }
  }
}