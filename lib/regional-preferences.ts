'use client'

import { Region } from '@prisma/client'

// Ordre de préférence par défaut
const DEFAULT_REGION_PRIORITY: Region[] = ['FR', 'EU', 'WOR', 'JP', 'US']

// Ordres de préférence selon la région choisie
const REGION_PRIORITIES: Record<Region, Region[]> = {
  FR: ['FR', 'EU', 'WOR', 'JP', 'US'],
  EU: ['EU', 'FR', 'WOR', 'JP', 'US'],
  WOR: ['WOR', 'EU', 'FR', 'JP', 'US'],
  JP: ['JP', 'WOR', 'EU', 'FR', 'US'],
  US: ['US', 'WOR', 'EU', 'FR', 'JP']
}

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
 * Obtient l'ordre de priorité des régions selon la préférence de l'utilisateur
 */
export function getRegionPriority(preferredRegion: Region = 'FR'): Region[] {
  return REGION_PRIORITIES[preferredRegion] || DEFAULT_REGION_PRIORITY
}

/**
 * Sélectionne le meilleur média de console selon les préférences régionales
 */
export function selectBestConsoleMedia(
  medias: ConsoleMedias[],
  mediaType: string,
  preferredRegion: Region = 'FR'
): ConsoleMedias | null {
  if (!medias || medias.length === 0) return null
  
  // Filtrer par type de média
  const mediasOfType = medias.filter(m => m.type === mediaType)
  
  if (mediasOfType.length === 0) return null
  
  // Si un seul média, le retourner
  if (mediasOfType.length === 1) return mediasOfType[0]
  
  // Sélectionner selon l'ordre de priorité régional
  const regionPriority = getRegionPriority(preferredRegion)
  
  for (const region of regionPriority) {
    const mediaForRegion = mediasOfType.find(m => m.region === region)
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
  preferredRegion: Region = 'FR'
): GameMedias | null {
  if (!medias || medias.length === 0) return null
  
  // Filtrer par type de média
  const mediasOfType = medias.filter(m => m.mediaType === mediaType)
  
  if (mediasOfType.length === 0) return null
  
  // Si un seul média, le retourner
  if (mediasOfType.length === 1) return mediasOfType[0]
  
  // Sélectionner selon l'ordre de priorité régional
  const regionPriority = getRegionPriority(preferredRegion)
  
  for (const region of regionPriority) {
    const mediaForRegion = mediasOfType.find(m => m.region === region)
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
  preferredRegion: Region = 'FR'
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
  preferredRegion: Region = 'FR'
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
  preferredRegion: Region = 'FR'
): Date | null {
  const regionPriority = getRegionPriority(preferredRegion)
  
  for (const region of regionPriority) {
    switch (region) {
      case 'FR':
        if (game.releaseDateFR) return game.releaseDateFR
        break
      case 'EU':
        if (game.releaseDateEU) return game.releaseDateEU
        break
      case 'US':
        if (game.releaseDateUS) return game.releaseDateUS
        break
      case 'JP':
        if (game.releaseDateJP) return game.releaseDateJP
        break
      case 'WOR':
        if (game.releaseDateWOR) return game.releaseDateWOR
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
  preferredRegion: Region = 'FR'
): string {
  // Pour le moment, retourner le titre par défaut
  // À l'avenir, on pourrait ajouter des titres régionaux
  if (game.regionalTitles && game.regionalTitles[preferredRegion]) {
    return game.regionalTitles[preferredRegion]!
  }
  
  return game.title
}

/**
 * Obtient la description selon la région préférée (extension future)
 */
export function getRegionalDescription(
  item: RegionalConsoleData | RegionalGameData,
  preferredRegion: Region = 'FR'
): string | null {
  // Pour le moment, retourner la description par défaut
  // À l'avenir, on pourrait ajouter des descriptions régionales
  if (item.regionalDescriptions && item.regionalDescriptions[preferredRegion]) {
    return item.regionalDescriptions[preferredRegion]!
  }
  
  return item.description
}