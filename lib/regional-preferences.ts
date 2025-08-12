import { Region } from '@prisma/client'

// Ordre de préférence par défaut (ss en dernier comme région screenscraper)
const DEFAULT_REGION_PRIORITY = ['FR', 'EU', 'WOR', 'JP', 'US', 'ss'] as const

// Ordres de préférence selon la région choisie (ss toujours en dernier)
const REGION_PRIORITIES = {
  FR: ['FR', 'EU', 'WOR', 'JP', 'US', 'ss'],
  EU: ['EU', 'FR', 'WOR', 'JP', 'US', 'ss'],
  WOR: ['WOR', 'EU', 'FR', 'JP', 'US', 'ss'],
  JP: ['JP', 'WOR', 'EU', 'FR', 'US', 'ss'],
  US: ['US', 'WOR', 'EU', 'FR', 'JP', 'ss'],
  ss: ['ss', 'WOR', 'EU', 'FR', 'JP', 'US'] // Si ss est sélectionné, le prioriser mais garder les autres
} as const

// Type pour les régions supportées (incluant ss)
export type SupportedRegion = 'FR' | 'EU' | 'WOR' | 'JP' | 'US' | 'ss'

// Mapping des régions Prisma vers nos types
export const REGION_MAPPING = {
  'fr': 'FR',
  'eu': 'EU', 
  'wor': 'WOR',
  'jp': 'JP',
  'us': 'US',
  'ss': 'ss'
} as const

export interface ConsoleMedias {
  id: string
  type: string
  region: string
  url: string
  localPath: string
  format: string
  fileName: string
}

export interface GameMedias {
  id: string
  mediaType: string
  region: string
  url: string
  localPath: string | null
  fileName: string
}

export interface RegionalConsoleData {
  id: string
  name: string
  slug: string
  manufacturer: string
  releaseYear: number | null
  description: string
  image: string | null
  medias: ConsoleMedias[]
  // Données régionales potentielles (pour extension future)
  regionalNames?: Partial<Record<Region, string>>
  regionalDescriptions?: Partial<Record<Region, string>>
}

export interface RegionalGameData {
  id: string
  title: string
  slug: string
  consoleId: string
  releaseYear: number | null
  description: string | null
  image: string | null
  medias: GameMedias[]
  // Données régionales
  releaseDateEU: Date | null
  releaseDateFR: Date | null
  releaseDateJP: Date | null
  releaseDateUS: Date | null
  releaseDateWOR: Date | null
  // Noms régionaux potentiels (pour extension future)
  regionalTitles?: Partial<Record<Region, string>>
  regionalDescriptions?: Partial<Record<Region, string>>
}

/**
 * Convertit une région Prisma en région supportée
 */
export function mapPrismaRegion(region: string): SupportedRegion {
  const upperRegion = region.toUpperCase()
  return (REGION_MAPPING[region as keyof typeof REGION_MAPPING] || upperRegion) as SupportedRegion
}

/**
 * Obtient l'ordre de priorité des régions selon la préférence de l'utilisateur
 */
export function getRegionPriority(preferredRegion: SupportedRegion = 'FR'): SupportedRegion[] {
  return [...(REGION_PRIORITIES[preferredRegion] || DEFAULT_REGION_PRIORITY)]
}

/**
 * Version pour compatibilité avec les régions Prisma (minuscules)
 */
export function getRegionPriorityLowercase(preferredRegion: string = 'fr'): string[] {
  const mappedRegion = mapPrismaRegion(preferredRegion)
  const priority = getRegionPriority(mappedRegion)
  return priority.map(r => r === 'ss' ? 'ss' : r.toLowerCase())
}

/**
 * Sélectionne le meilleur média de console selon les préférences régionales
 */
export function selectBestConsoleMedia(
  medias: ConsoleMedias[],
  mediaType: string,
  preferredRegion: string = 'fr'
): ConsoleMedias | null {
  if (!medias || medias.length === 0) return null
  
  // Filtrer par type de média
  const mediasOfType = medias.filter(m => m.type === mediaType)
  
  if (mediasOfType.length === 0) return null
  
  // Si un seul média, le retourner
  if (mediasOfType.length === 1) return mediasOfType[0]
  
  // Sélectionner selon l'ordre de priorité régional (avec ss en dernier)
  const regionPriority = getRegionPriorityLowercase(preferredRegion)
  
  for (const region of regionPriority) {
    const mediaForRegion = mediasOfType.find(m => m.region.toLowerCase() === region)
    if (mediaForRegion) return mediaForRegion
  }
  
  // Si aucune région prioritaire trouvée, retourner le premier
  return mediasOfType[0]
}

/**
 * Sélectionne le meilleur média de jeu selon les préférences régionales
 */
export function selectBestGameMedia(
  medias: GameMedias[],
  mediaType: string,
  preferredRegion: string = 'fr'
): GameMedias | null {
  if (!medias || medias.length === 0) return null
  
  // Filtrer par type de média
  const mediasOfType = medias.filter(m => m.mediaType === mediaType)
  
  if (mediasOfType.length === 0) return null
  
  // Si un seul média, le retourner
  if (mediasOfType.length === 1) return mediasOfType[0]
  
  // Sélectionner selon l'ordre de priorité régional (avec ss en dernier)
  const regionPriority = getRegionPriorityLowercase(preferredRegion)
  
  for (const region of regionPriority) {
    const mediaForRegion = mediasOfType.find(m => m.region.toLowerCase() === region)
    if (mediaForRegion) return mediaForRegion
  }
  
  // Si aucune région prioritaire trouvée, retourner le premier
  return mediasOfType[0]
}

/**
 * Sélectionne la meilleure image de console selon les préférences régionales
 */
export function selectBestConsoleImage(
  console: RegionalConsoleData,
  preferredRegion: string = 'fr'
): string | null {
  // Si une image principale existe déjà, la prioriser
  if (console.image) return console.image
  
  // Types d'images par ordre de priorité
  const imageTypePriority = ['logo-svg', 'wheel', 'photo', 'illustration']
  
  for (const imageType of imageTypePriority) {
    const bestMedia = selectBestConsoleMedia(console.medias, imageType, preferredRegion)
    if (bestMedia) return bestMedia.localPath
  }
  
  return null
}

/**
 * Sélectionne la meilleure image de jeu selon les préférences régionales
 */
export function selectBestGameImage(
  game: RegionalGameData,
  preferredRegion: string = 'fr'
): string | null {
  // Si une image principale existe déjà, la prioriser
  if (game.image) return game.image
  
  // Types d'images par ordre de priorité pour les jeux
  const imageTypePriority = ['box-2D', 'box-3D', 'wheel', 'sstitle', 'ss']
  
  for (const imageType of imageTypePriority) {
    const bestMedia = selectBestGameMedia(game.medias, imageType, preferredRegion)
    if (bestMedia?.localPath) return bestMedia.localPath
  }
  
  return null
}

/**
 * Obtient la date de sortie selon la région préférée
 */
export function getRegionalReleaseDate(
  game: RegionalGameData,
  preferredRegion: string = 'fr'
): Date | null {
  const regionPriority = getRegionPriorityLowercase(preferredRegion)
  
  for (const region of regionPriority) {
    switch (region) {
      case 'fr':
        if (game.releaseDateFR) return game.releaseDateFR
        break
      case 'eu':
        if (game.releaseDateEU) return game.releaseDateEU
        break
      case 'us':
        if (game.releaseDateUS) return game.releaseDateUS
        break
      case 'jp':
        if (game.releaseDateJP) return game.releaseDateJP
        break
      case 'wor':
        if (game.releaseDateWOR) return game.releaseDateWOR
        break
      case 'ss':
        // ss n'a pas de date spécifique, ignorer
        break
    }
  }
  
  return null
}

/**
 * Obtient le titre selon la région préférée (extension future)
 */
export function getRegionalTitle(
  game: RegionalGameData,
  preferredRegion: string = 'fr'
): string {
  // Pour le moment, retourner le titre par défaut
  // À l'avenir, on pourrait ajouter des titres régionaux
  const mappedRegion = mapPrismaRegion(preferredRegion)
  if (game.regionalTitles && mappedRegion in game.regionalTitles) {
    const title = game.regionalTitles[mappedRegion as keyof typeof game.regionalTitles]
    if (title) return title
  }
  
  return game.title
}

/**
 * Obtient la description selon la région préférée (extension future)
 */
export function getRegionalDescription(
  item: RegionalConsoleData | RegionalGameData,
  preferredRegion: string = 'fr'
): string | null {
  // Pour le moment, retourner la description par défaut
  // À l'avenir, on pourrait ajouter des descriptions régionales
  const mappedRegion = mapPrismaRegion(preferredRegion)
  if (item.regionalDescriptions && mappedRegion in item.regionalDescriptions) {
    const description = item.regionalDescriptions[mappedRegion as keyof typeof item.regionalDescriptions]
    if (description) return description
  }
  
  return item.description
}