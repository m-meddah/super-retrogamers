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

    // Find the best match according to priority
    for (const region of priorityOrder) {
      const regionalName = console.regionalNames.find(rn => rn.region === region)
      if (regionalName && regionalName.name) {
        return regionalName.name
      }
    }

    // Fallback to default name if no regional name found
    return console.name

  } catch (error) {
    console.error('Error getting regional console name:', error)
    return 'Console inconnue'
  }
}

/**
 * OPTIMIZED: Get multiple console names in batch for homepage
 */
export async function getBatchConsoleNames(
  consoleIds: string[], 
  preferredRegion: Region
): Promise<Record<string, string>> {
  try {
    // Single query to get all consoles with their regional names
    const consoles = await prisma.console.findMany({
      where: { 
        id: { in: consoleIds } 
      },
      include: {
        regionalNames: true
      }
    })

    const result: Record<string, string> = {}
    const priorityOrder = REGION_PRIORITY[preferredRegion] || REGION_PRIORITY.FR

    for (const console of consoles) {
      // If no regional names available, use the default name
      if (!console.regionalNames || console.regionalNames.length === 0) {
        result[console.id] = console.name
        continue
      }

      // Find the best match according to priority
      let bestName = console.name
      for (const region of priorityOrder) {
        const regionalName = console.regionalNames.find(rn => rn.region === region)
        if (regionalName && regionalName.name) {
          bestName = regionalName.name
          break
        }
      }
      
      result[console.id] = bestName
    }

    return result

  } catch (error) {
    console.error('Error getting batch console names:', error)
    // Return fallback object with default names
    const consoles = await prisma.console.findMany({
      where: { id: { in: consoleIds } },
      select: { id: true, name: true }
    })
    
    return consoles.reduce((acc, console) => {
      acc[console.id] = console.name
      return acc
    }, {} as Record<string, string>)
  }
}

/**
 * Get release date for a console in a specific region
 */
export async function getConsoleReleaseDate(consoleId: string, preferredRegion: Region): Promise<Date | null> {
  try {
    const console = await prisma.console.findUnique({
      where: { id: consoleId },
      include: {
        regionalDates: true
      }
    })

    if (!console) {
      return null
    }

    // If no regional dates available, construct date from releaseYear
    if (!console.regionalDates || console.regionalDates.length === 0) {
      return console.releaseYear ? new Date(console.releaseYear, 0, 1) : null
    }

    // Get priority order for preferred region
    const priorityOrder = REGION_PRIORITY[preferredRegion] || REGION_PRIORITY.FR

    // Find the best match according to priority
    for (const region of priorityOrder) {
      const regionalDate = console.regionalDates.find(rd => rd.region === region)
      if (regionalDate && regionalDate.releaseDate) {
        return regionalDate.releaseDate
      }
    }

    // Fallback to default year
    return console.releaseYear ? new Date(console.releaseYear, 0, 1) : null

  } catch (error) {
    console.error('Error getting regional console release date:', error)
    return null
  }
}

/**
 * OPTIMIZED: Get multiple console release dates in batch
 */
export async function getBatchConsoleReleaseDates(
  consoleIds: string[], 
  preferredRegion: Region
): Promise<Record<string, Date | null>> {
  try {
    // Single query to get all consoles with their regional release dates
    const consoles = await prisma.console.findMany({
      where: { 
        id: { in: consoleIds } 
      },
      include: {
        regionalDates: true
      }
    })

    const result: Record<string, Date | null> = {}
    const priorityOrder = REGION_PRIORITY[preferredRegion] || REGION_PRIORITY.FR

    for (const console of consoles) {
      // If no regional dates available, construct date from releaseYear
      if (!console.regionalDates || console.regionalDates.length === 0) {
        result[console.id] = console.releaseYear ? new Date(console.releaseYear, 0, 1) : null
        continue
      }

      // Find the best match according to priority
      let bestDate: Date | null = console.releaseYear ? new Date(console.releaseYear, 0, 1) : null
      for (const region of priorityOrder) {
        const regionalDate = console.regionalDates.find(rd => rd.region === region)
        if (regionalDate && regionalDate.releaseDate) {
          bestDate = regionalDate.releaseDate
          break
        }
      }
      
      result[console.id] = bestDate
    }

    return result

  } catch (error) {
    console.error('Error getting batch console release dates:', error)
    // Return fallback object with default dates
    const consoles = await prisma.console.findMany({
      where: { id: { in: consoleIds } },
      select: { id: true, releaseYear: true }
    })
    
    return consoles.reduce((acc, console) => {
      acc[console.id] = console.releaseYear ? new Date(console.releaseYear, 0, 1) : null
      return acc
    }, {} as Record<string, Date | null>)
  }
}

/**
 * Get the best game title for a given region preference
 */
export async function getGameTitle(gameId: string, preferredRegion: Region): Promise<string> {
  try {
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

    // Find the best match according to priority
    for (const region of priorityOrder) {
      const regionalTitle = game.regionalTitles.find(rt => rt.region === region)
      if (regionalTitle && regionalTitle.title) {
        return regionalTitle.title
      }
    }

    // Fallback to default title if no regional title found
    return game.title

  } catch (error) {
    console.error('Error getting game title:', error)
    return 'Jeu inconnu'
  }
}

/**
 * Get release date for a game in a specific region
 */
export async function getGameReleaseDate(gameId: string, preferredRegion: Region): Promise<Date | null> {
  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        regionalDates: true
      }
    })

    if (!game) {
      return null
    }

    // If no regional dates available, construct date from releaseYear
    if (!game.regionalDates || game.regionalDates.length === 0) {
      return game.releaseYear ? new Date(game.releaseYear, 0, 1) : null
    }

    // Get priority order for preferred region
    const priorityOrder = REGION_PRIORITY[preferredRegion] || REGION_PRIORITY.FR

    // Find the best match according to priority
    for (const region of priorityOrder) {
      const regionalDate = game.regionalDates.find(rd => rd.region === region)
      if (regionalDate && regionalDate.releaseDate) {
        return regionalDate.releaseDate
      }
    }

    // Fallback to default year
    return game.releaseYear ? new Date(game.releaseYear, 0, 1) : null

  } catch (error) {
    console.error('Error getting regional game release date:', error)
    return null
  }
}