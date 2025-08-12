'use server'

import { prisma } from '@/lib/prisma'
import { Region } from '@prisma/client'

export interface ActionState {
  success?: boolean
  error?: string
  message?: string
  data?: unknown
}

export async function addRomAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const gameId = formData.get('gameId') as string
    const region = formData.get('region') as Region
    const version = formData.get('version') as string || null
    const language = formData.get('language') as string || null
    const archiveOrgUrl = formData.get('archiveOrgUrl') as string || null
    const myrientUrl = formData.get('myrientUrl') as string || null
    const fileName = formData.get('fileName') as string || null
    const quality = formData.get('quality') as string || null
    
    // Flags ROM
    const isBestVersion = formData.get('isBestVersion') === 'on'
    const isBeta = formData.get('isBeta') === 'on'
    const isDemo = formData.get('isDemo') === 'on'
    const isHacked = formData.get('isHacked') === 'on'
    const isTranslated = formData.get('isTranslated') === 'on'
    const isUnlicensed = formData.get('isUnlicensed') === 'on'
    const isAlternative = formData.get('isAlternative') === 'on'

    if (!gameId?.trim()) {
      return {
        success: false,
        error: 'ID du jeu requis'
      }
    }

    if (!region) {
      return {
        success: false,
        error: 'Région requise'
      }
    }

    if (!archiveOrgUrl && !myrientUrl) {
      return {
        success: false,
        error: 'Au moins un lien (Archive.org ou Myrient) est requis'
      }
    }

    // Vérifier que le jeu existe
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    })

    if (!game) {
      return {
        success: false,
        error: 'Jeu non trouvé'
      }
    }

    // Vérifier si une ROM existe déjà pour ce jeu, cette région et cette version
    const existingRom = await prisma.rom.findUnique({
      where: {
        gameId_region_version: {
          gameId,
          region,
          version: version || ''
        }
      }
    })

    if (existingRom) {
      return {
        success: false,
        error: 'Une ROM existe déjà pour ce jeu, cette région et cette version'
      }
    }

    // Créer la ROM
    const rom = await prisma.rom.create({
      data: {
        gameId,
        region,
        version,
        language,
        isBestVersion,
        isBeta,
        isDemo,
        isHacked,
        isTranslated,
        isUnlicensed,
        isAlternative,
        archiveOrgUrl,
        myrientUrl,
        fileName,
        quality: quality || null,
        priority: 0,
        verifiedAt: new Date()
      },
      include: {
        game: {
          select: {
            title: true
          }
        }
      }
    })

    return {
      success: true,
      message: `ROM ajoutée avec succès pour "${rom.game.title}" (${region})`,
      data: {
        romId: rom.id,
        gameTitle: rom.game.title,
        region: rom.region
      }
    }
  } catch (error) {
    console.error('Erreur ajout ROM:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout de la ROM'
    }
  }
}

export async function getRomsByGameAction(gameId: string) {
  try {
    const roms = await prisma.rom.findMany({
      where: { gameId },
      include: {
        game: {
          select: {
            title: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { region: 'asc' },
        { version: 'asc' }
      ]
    })

    return {
      success: true,
      data: roms
    }
  } catch (error) {
    console.error('Erreur récupération ROMs:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des ROMs'
    }
  }
}

export async function deleteRomAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const romId = formData.get('romId') as string

    if (!romId?.trim()) {
      return {
        success: false,
        error: 'ID de la ROM requis'
      }
    }

    // Vérifier que la ROM existe
    const rom = await prisma.rom.findUnique({
      where: { id: romId },
      include: {
        game: {
          select: {
            title: true
          }
        }
      }
    })

    if (!rom) {
      return {
        success: false,
        error: 'ROM non trouvée'
      }
    }

    // Supprimer la ROM
    await prisma.rom.delete({
      where: { id: romId }
    })

    return {
      success: true,
      message: `ROM supprimée avec succès pour "${rom.game.title}" (${rom.region})`,
      data: {
        gameTitle: rom.game.title,
        region: rom.region
      }
    }
  } catch (error) {
    console.error('Erreur suppression ROM:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la suppression de la ROM'
    }
  }
}

export async function searchGamesForRomAction(query: string) {
  try {
    if (!query || query.length < 2) {
      return {
        success: true,
        data: []
      }
    }

    const games = await prisma.game.findMany({
      where: {
        title: {
          contains: query,
          mode: 'insensitive'
        }
      },
      include: {
        console: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        title: 'asc'
      },
      take: 20
    })

    return {
      success: true,
      data: games
    }
  } catch (error) {
    console.error('Erreur recherche jeux:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la recherche de jeux'
    }
  }
}