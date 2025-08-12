'use server'

import { getScreenscraperService } from '@/lib/screenscraper-client'
import { prisma } from '@/lib/prisma'
import { scrapeConsolesFromScreenscraper } from '@/lib/screenscraper-service'

export interface ActionState {
  success?: boolean
  error?: string
  message?: string
  data?: unknown
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