'use server'

import { prisma } from '@/lib/prisma'
import type { Region } from '@prisma/client'

// Priority order for regional names (similar to regional-preferences.ts)
const REGION_PRIORITY: Record<Region, Region[]> = {
  FR: ['FR', 'EU', 'WOR', 'US', 'JP', 'ASI'],
  EU: ['EU', 'FR', 'WOR', 'US', 'JP', 'ASI'], 
  WOR: ['WOR', 'EU', 'FR', 'US', 'JP', 'ASI'],
  US: ['US', 'WOR', 'EU', 'FR', 'JP', 'ASI'],
  JP: ['JP', 'ASI', 'WOR', 'EU', 'US', 'FR'],
  ASI: ['ASI', 'JP', 'WOR', 'EU', 'US', 'FR']
}

/**
 * Get the best console name for a given region preference
 */
export async function getConsoleName(consoleId: string, preferredRegion: Region): Promise<string> {
  try {
    // Get console with regional names
    const console = await prisma.console.findUnique({
      where: { id: consoleId },
      include: {
        regionalNames: true
      }
    })

    if (!console) {
      return 'Console inconnue'
    }

    // If no regional names available, use the default name
    if (!console.regionalNames || console.regionalNames.length === 0) {
      return console.name
    }

    // Get priority order for preferred region
    const priorityOrder = REGION_PRIORITY[preferredRegion] || REGION_PRIORITY.FR

    // Find the best regional name based on priority
    for (const region of priorityOrder) {
      const regionalName = console.regionalNames.find(rn => rn.region === region)
      if (regionalName?.name) {
        return regionalName.name
      }
    }

    // Fallback to any available regional name
    if (console.regionalNames.length > 0) {
      return console.regionalNames[0].name
    }

    // Final fallback to default name
    return console.name

  } catch (error) {
    console.error('Error getting console name:', error)
    return 'Console inconnue'
  }
}

/**
 * Get the best game title for a given region preference
 */
export async function getGameTitle(gameId: string, preferredRegion: Region): Promise<string> {
  try {
    // Get game with regional titles
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        regionalTitles: true
      }
    })

    if (!game) {
      return 'Jeu inconnu'
    }

    // If no regional titles available, use the default title
    if (!game.regionalTitles || game.regionalTitles.length === 0) {
      return game.title
    }

    // Get priority order for preferred region
    const priorityOrder = REGION_PRIORITY[preferredRegion] || REGION_PRIORITY.FR

    // Find the best regional title based on priority
    for (const region of priorityOrder) {
      const regionalTitle = game.regionalTitles.find(rt => rt.region === region)
      if (regionalTitle?.title) {
        return regionalTitle.title
      }
    }

    // Fallback to any available regional title
    if (game.regionalTitles.length > 0) {
      return game.regionalTitles[0].title
    }

    // Final fallback to default title
    return game.title

  } catch (error) {
    console.error('Error getting game title:', error)
    return 'Jeu inconnu'
  }
}

/**
 * Get the best release date for a console in a given region
 */
export async function getConsoleReleaseDate(consoleId: string, preferredRegion: Region): Promise<Date | null> {
  try {
    // Get console with regional dates
    const console = await prisma.console.findUnique({
      where: { id: consoleId },
      include: {
        regionalDates: true
      }
    })

    if (!console) {
      return null
    }

    // If no regional dates available, construct from release year
    if (!console.regionalDates || console.regionalDates.length === 0) {
      return console.releaseYear ? new Date(console.releaseYear, 0, 1) : null
    }

    // Get priority order for preferred region
    const priorityOrder = REGION_PRIORITY[preferredRegion] || REGION_PRIORITY.FR

    // Find the best regional date based on priority
    for (const region of priorityOrder) {
      const regionalDate = console.regionalDates.find(rd => rd.region === region)
      if (regionalDate?.releaseDate) {
        return regionalDate.releaseDate
      }
    }

    // Fallback to any available regional date
    if (console.regionalDates.length > 0) {
      const firstDate = console.regionalDates[0]
      if (firstDate.releaseDate) {
        return firstDate.releaseDate
      }
    }

    // Final fallback to constructed date from year
    return console.releaseYear ? new Date(console.releaseYear, 0, 1) : null

  } catch (error) {
    console.error('Error getting console release date:', error)
    return null
  }
}

/**
 * Get the best game release date for a given region preference
 */
export async function getGameReleaseDate(gameId: string): Promise<Date | null> {
  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    })

    if (!game) {
      return null
    }

    // TODO: Re-implement regional dates with new schema structure
    // const dateFieldMap: Record<Region, keyof typeof game> = {
    //   FR: 'releaseDateFR',
    //   EU: 'releaseDateEU', 
    //   WOR: 'releaseDateWOR',
    //   US: 'releaseDateUS',
    //   JP: 'releaseDateJP',
    //   ASI: 'releaseDateUS' // Fallback to US for ASI
    // }

    // Get priority order for preferred region
    // const priorityOrder = REGION_PRIORITY[preferredRegion] || REGION_PRIORITY.FR

    // TODO: Regional dates temporarily disabled due to schema changes
    // Find the best regional release date based on priority
    // for (const region of priorityOrder) {
    //   const fieldName = dateFieldMap[region]
    //   if (fieldName && game[fieldName]) {
    //     return game[fieldName] as Date
    //   }
    // }

    // Final fallback to constructed date from release year
    return game.releaseYear ? new Date(game.releaseYear, 0, 1) : null

  } catch (error) {
    console.error('Error getting game release date:', error)
    return null
  }
}