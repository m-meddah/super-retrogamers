import type { ConsoleWithMedias, GameWithConsole } from '@/lib/data-prisma'
import { selectBestConsoleMedia } from '@/lib/regional-preferences'

/**
 * Génère l'URL du favicon pour une console en utilisant le dossier minicon
 */
export function getConsoleFaviconUrl(console: ConsoleWithMedias, preferredRegion: string = 'fr'): string | null {
  // 1. D'abord essayer de trouver un média de type "minicon" dans la base
  const miniconMedia = selectBestConsoleMedia(console.medias, 'minicon', preferredRegion)
  if (miniconMedia && miniconMedia.localPath) {
    return miniconMedia.localPath
  }
  
  // 2. Essayer le chemin direct vers le dossier minicon basé sur la structure observée
  // Utiliser le screenscrapeId au lieu de l'id interne
  if (console.ssConsoleId) {
    const miniconPath = `/consoles/${console.slug}/minicon/unknown/${console.ssConsoleId}_minicon_undefined.png`
    return miniconPath
  }
  
  // 3. Fallback : utiliser d'autres types de médias dans l'ordre de priorité pour favicon
  const faviconTypePriority = ['wheel', 'logo-svg', 'icon', 'photo', 'illustration']
  
  for (const imageType of faviconTypePriority) {
    const bestMedia = selectBestConsoleMedia(console.medias, imageType, preferredRegion)
    if (bestMedia && bestMedia.localPath) {
      return bestMedia.localPath
    }
  }
  
  // 4. Dernier recours : pas de favicon spécifique
  return null
}

/**
 * Génère l'URL du favicon pour un jeu en utilisant ses médias ou l'icône de la console
 */
export function getGameFaviconUrl(game: GameWithConsole): string | null {
  // 1. D'abord essayer avec les médias du jeu s'ils existent
  if (game.medias && game.medias.length > 0) {
    const gameImageTypes = ['wheel', 'box-2D', 'sstitle', 'ss']
    
    for (const imageType of gameImageTypes) {
      const gameMedia = game.medias.find(m => m.mediaType === imageType)
      if (gameMedia && gameMedia.localPath) {
        return gameMedia.localPath
      }
    }
  }
  
  // 2. Fallback : construire le chemin vers le minicon de la console parente
  if (game.console) {
    return getConsoleFaviconUrlFromConsole(game.console)
  }
  
  return null
}

/**
 * Génère l'URL du favicon pour une console à partir de données minimales
 */
export function getConsoleFaviconUrlFromConsole(console: { id: string; slug: string; screenscrapeId?: number | null }): string | null {
  // Construire le chemin vers le minicon de la console en utilisant screenscrapeId
  if (console.ssConsoleId) {
    return `/consoles/${console.slug}/minicon/unknown/${console.ssConsoleId}_minicon_undefined.png`
  }
  return null
}

/**
 * Génère les métadonnées de favicon pour Next.js
 */
export function generateFaviconMetadata(faviconUrl: string | null, fallbackTitle: string) {
  const baseMetadata = {
    title: fallbackTitle,
  }
  
  if (faviconUrl) {
    return {
      ...baseMetadata,
      icons: {
        icon: faviconUrl, // Favicon personnalisé en priorité
        shortcut: faviconUrl,
        apple: faviconUrl
      }
    }
  }
  
  // Fallback vers le favicon par défaut seulement si pas de favicon personnalisé
  return {
    ...baseMetadata,
    icons: {
      icon: '/favicon.ico',
    }
  }
}

/**
 * Convertit un chemin local en URL absolue pour les métadonnées
 */
export function getAbsoluteFaviconUrl(localPath: string, baseUrl?: string): string {
  // Si c'est déjà une URL absolue, la retourner telle quelle
  if (localPath.startsWith('http')) {
    return localPath
  }
  
  // Ajouter le préfixe de domaine si fourni
  if (baseUrl) {
    return `${baseUrl}${localPath.startsWith('/') ? localPath : `/${localPath}`}`
  }
  
  // Retourner le chemin relatif (Next.js le gérera)
  return localPath.startsWith('/') ? localPath : `/${localPath}`
}