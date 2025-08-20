import type { ConsoleWithMedias, GameWithConsole } from '@/lib/data-prisma'
import { selectBestConsoleMedia } from '@/lib/regional-preferences'
import { getCachedMediaUrl } from '@/lib/media-url-cache'

/**
 * Génère l'URL du favicon pour une console en utilisant le système de cache média
 */
export async function getConsoleFaviconUrl(console: ConsoleWithMedias, preferredRegion: string = 'WOR'): Promise<string | null> {
  // 1. D'abord essayer de trouver un média de type "minicon" dans la base
  const miniconMedia = selectBestConsoleMedia(console.medias, 'minicon', preferredRegion)
  if (miniconMedia && miniconMedia.localPath) {
    return miniconMedia.localPath
  }
  
  // 2. Essayer de récupérer le minicon via le système de cache média
  // Note: minicon n'a pas de région, on utilise 'WOR' par défaut
  if (console.ssConsoleId) {
    const miniconUrl = await getCachedMediaUrl('console', console.id, 'minicon', 'WOR')
    if (miniconUrl) {
      return miniconUrl
    }
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
export async function getGameFaviconUrl(game: GameWithConsole, region: string = 'WOR'): Promise<string | null> {
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
    return await getConsoleFaviconUrlFromConsole(game.console, region)
  }
  
  return null
}

/**
 * Génère l'URL du favicon pour une console à partir de données minimales
 */
export async function getConsoleFaviconUrlFromConsole(console: { id: string; slug: string; ssConsoleId?: number | null }): Promise<string | null> {
  // Utiliser le système de cache média pour récupérer le minicon
  // Note: minicon n'a pas de région, on utilise 'WOR' par défaut
  if (console.ssConsoleId) {
    const miniconUrl = await getCachedMediaUrl('console', console.id, 'minicon', 'WOR')
    if (miniconUrl) {
      return miniconUrl
    }
  }
  return null
}

/**
 * Génère les métadonnées de favicon pour Next.js
 */
export function generateFaviconMetadata(faviconUrl: string | null, fallbackTitle: string) {
  const baseMetadata = {
    title: fallbackTitle}
  
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
      icon: '/favicon.ico'}
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