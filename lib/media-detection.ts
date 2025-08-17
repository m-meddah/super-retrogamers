import { existsSync, readdirSync } from 'fs'
import { join } from 'path'

/**
 * Types de médias Screenscraper reconnus
 */
export const SCREENSCRAPER_MEDIA_TYPES = [
  'BoitierConsole3D',
  'box-2D',
  'box-3D', 
  'controller',
  'icon',
  'illustration',
  'logo-monochrome-svg',
  'logo-monochrome',
  'logo-svg',
  'minicon',
  'photo',
  'screenmarquee',
  'ss', // screenshots
  'sstitle', // title screen
  'support-2D',
  'support-texture',
  'wheel-carbon',
  'wheel-steel',
  'wheel'
]

/**
 * Vérifie si un média existe déjà pour une console
 */
export function checkExistingConsoleMedia(
  consoleSlug: string, 
  mediaType: string, 
  region: string = 'unknown'
): string | null {
  const basePath = join(process.cwd(), 'public', 'consoles', consoleSlug, mediaType)
  
  if (!existsSync(basePath)) {
    return null
  }

  const regionPath = join(basePath, region)
  if (!existsSync(regionPath)) {
    // Essayer avec 'unknown' si la région spécifique n'existe pas
    const unknownPath = join(basePath, 'unknown')
    if (!existsSync(unknownPath)) {
      return null
    }
    
    try {
      const files = readdirSync(unknownPath)
      const mediaFile = files.find(f => f.includes('_' + mediaType + '_'))
      return mediaFile ? `/consoles/${consoleSlug}/${mediaType}/unknown/${mediaFile}` : null
    } catch {
      return null
    }
  }

  try {
    const files = readdirSync(regionPath)
    const mediaFile = files.find(f => f.includes('_' + mediaType + '_'))
    return mediaFile ? `/consoles/${consoleSlug}/${mediaType}/${region}/${mediaFile}` : null
  } catch {
    return null
  }
}

/**
 * Vérifie si un média existe déjà pour un jeu
 */
export function checkExistingGameMedia(
  gameSlug: string, 
  mediaType: string, 
  region: string = 'unknown'
): string | null {
  const basePath = join(process.cwd(), 'public', 'games', gameSlug, mediaType)
  
  if (!existsSync(basePath)) {
    return null
  }

  const regionPath = join(basePath, region)
  if (!existsSync(regionPath)) {
    // Essayer avec 'unknown' si la région spécifique n'existe pas
    const unknownPath = join(basePath, 'unknown')
    if (!existsSync(unknownPath)) {
      return null
    }
    
    try {
      const files = readdirSync(unknownPath)
      const mediaFile = files.find(f => f.includes('_' + mediaType + '_'))
      return mediaFile ? `/games/${gameSlug}/${mediaType}/unknown/${mediaFile}` : null
    } catch {
      return null
    }
  }

  try {
    const files = readdirSync(regionPath)
    const mediaFile = files.find(f => f.includes('_' + mediaType + '_'))
    return mediaFile ? `/games/${gameSlug}/${mediaType}/${region}/${mediaFile}` : null
  } catch {
    return null
  }
}

/**
 * Scanne tous les médias existants pour une console
 */
export function scanExistingConsoleMedias(consoleSlug: string): Array<{
  mediaType: string
  region: string
  localPath: string
  fileName: string
}> {
  const medias: Array<{
    mediaType: string
    region: string
    localPath: string
    fileName: string
  }> = []

  const consolePath = join(process.cwd(), 'public', 'consoles', consoleSlug)
  
  if (!existsSync(consolePath)) {
    return medias
  }

  try {
    const mediaTypeFolders = readdirSync(consolePath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    for (const mediaType of mediaTypeFolders) {
      if (!SCREENSCRAPER_MEDIA_TYPES.includes(mediaType)) {
        continue
      }

      const mediaTypePath = join(consolePath, mediaType)
      
      try {
        const regionFolders = readdirSync(mediaTypePath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)

        for (const region of regionFolders) {
          const regionPath = join(mediaTypePath, region)
          
          try {
            const files = readdirSync(regionPath)
            
            for (const fileName of files) {
              // Vérifier que c'est un fichier image valide
              if (/\.(png|jpg|jpeg|svg|gif|webp)$/i.test(fileName)) {
                medias.push({
                  mediaType,
                  region,
                  localPath: `/consoles/${consoleSlug}/${mediaType}/${region}/${fileName}`,
                  fileName
                })
              }
            }
          } catch (error) {
            console.warn(`Erreur lecture région ${region} pour ${mediaType}:`, error)
          }
        }
      } catch (error) {
        console.warn(`Erreur lecture type média ${mediaType}:`, error)
      }
    }
  } catch (error) {
    console.warn(`Erreur lecture console ${consoleSlug}:`, error)
  }

  return medias
}

/**
 * Scanne tous les médias existants pour un jeu
 */
export function scanExistingGameMedias(gameSlug: string): Array<{
  mediaType: string
  region: string
  localPath: string
  fileName: string
}> {
  const medias: Array<{
    mediaType: string
    region: string
    localPath: string
    fileName: string
  }> = []

  const gamePath = join(process.cwd(), 'public', 'games', gameSlug)
  
  if (!existsSync(gamePath)) {
    return medias
  }

  try {
    const mediaTypeFolders = readdirSync(gamePath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    for (const mediaType of mediaTypeFolders) {
      if (!SCREENSCRAPER_MEDIA_TYPES.includes(mediaType)) {
        continue
      }

      const mediaTypePath = join(gamePath, mediaType)
      
      try {
        const regionFolders = readdirSync(mediaTypePath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)

        for (const region of regionFolders) {
          const regionPath = join(mediaTypePath, region)
          
          try {
            const files = readdirSync(regionPath)
            
            for (const fileName of files) {
              // Vérifier que c'est un fichier image valide
              if (/\.(png|jpg|jpeg|svg|gif|webp)$/i.test(fileName)) {
                medias.push({
                  mediaType,
                  region,
                  localPath: `/games/${gameSlug}/${mediaType}/${region}/${fileName}`,
                  fileName
                })
              }
            }
          } catch (error) {
            console.warn(`Erreur lecture région ${region} pour ${mediaType}:`, error)
          }
        }
      } catch (error) {
        console.warn(`Erreur lecture type média ${mediaType}:`, error)
      }
    }
  } catch (error) {
    console.warn(`Erreur lecture jeu ${gameSlug}:`, error)
  }

  return medias
}

/**
 * Synchronise les médias existants avec la base de données
 */
export async function syncExistingMediasToDatabase() {
  const { prisma } = await import('@/lib/prisma')
  
  console.log('🔍 Scan des médias existants...')
  
  try {
    // Scan des consoles
    const consoles = await prisma.console.findMany({
      select: { id: true, slug: true }
    })

    for (const gameConsole of consoles) {
      const existingMedias = scanExistingConsoleMedias(gameConsole.slug)
      
      for (const media of existingMedias) {
        // Vérifier si le média existe déjà en base
        const existingDbMedia = await prisma.consoleMedia.findFirst({
          where: {
            consoleId: gameConsole.id,
            type: media.mediaType,
            region: media.region,
            fileName: media.fileName
          }
        })

        if (!existingDbMedia) {
          // Ajouter le média en base
          await prisma.consoleMedia.create({
            data: {
              consoleId: gameConsole.id,
              type: media.mediaType,
              region: media.region,
              url: media.localPath, // Même valeur que localPath pour les fichiers locaux
              localPath: media.localPath,
              format: media.fileName.split('.').pop()?.toLowerCase() || 'unknown',
              fileName: media.fileName
            }
          })
          
          console.log(`✅ Ajouté média console: ${gameConsole.slug}/${media.mediaType}/${media.region}`)
        }
      }
    }

    // Scan des jeux
    const games = await prisma.game.findMany({
      select: { id: true, slug: true }
    })

    for (const game of games) {
      const existingMedias = scanExistingGameMedias(game.slug)
      
      for (const media of existingMedias) {
        // Vérifier si le média existe déjà en base
        const existingDbMedia = await prisma.gameMedia.findFirst({
          where: {
            gameId: game.id,
            mediaType: media.mediaType,
            region: media.region,
            fileName: media.fileName
          }
        })

        if (!existingDbMedia) {
          // Ajouter le média en base
          await prisma.gameMedia.create({
            data: {
              gameId: game.id,
              mediaType: media.mediaType,
              region: media.region,
              format: media.fileName.split('.').pop()?.toLowerCase() || 'unknown',
              url: media.localPath,
              localPath: media.localPath,
              fileName: media.fileName,
              downloadAttempted: true,
              downloadSuccess: true
            }
          })
          
          console.log(`✅ Ajouté média jeu: ${game.slug}/${media.mediaType}/${media.region}`)
        }
      }
    }

    console.log('✨ Synchronisation des médias terminée')
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error)
    throw error
  }
}