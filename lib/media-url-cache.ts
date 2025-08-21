'use server'

import { prisma } from '@/lib/prisma'

/**
 * Cache intelligent des URLs de médias Screenscraper
 * - Cache les URLs pendant 24h pour éviter le rate limiting
 * - Utilise directement les URLs Screenscraper sans téléchargement
 * - Invalidation automatique après expiration
 */

// Interface pour le cache des URLs de médias (utilisée pour typage interne)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface MediaUrlCache {
  id: string
  entityType: 'game' | 'console'
  entityId: string
  mediaType: string
  region: string
  url: string
  screenscrapeId: number
  cachedAt: Date
  expiresAt: Date
  isValid: boolean
}

// Durée de cache : 24 heures pour éviter les appels API répétés
const CACHE_DURATION_HOURS = 24
const CACHE_DURATION_MS = CACHE_DURATION_HOURS * 60 * 60 * 1000

/**
 * Récupère la meilleure URL média disponible en optimisant les appels
 */
export async function getBestCachedMediaUrl(
  entityType: 'game' | 'console',
  entityId: string,
  mediaTypes: string[],
  regionPriority: string[]
): Promise<string | null> {
  try {
    // D'abord chercher tous les médias en cache
    const normalizedRegions = regionPriority.map(r => r.toLowerCase())
    
    const cached = await prisma.mediaUrlCache.findMany({
      where: {
        entityType,
        entityId,
        mediaType: { in: mediaTypes },
        region: { in: normalizedRegions },
        expiresAt: { gte: new Date() }
      },
      orderBy: [
        { mediaType: 'asc' },
        { region: 'asc' }
      ]
    })
    
    // Trouver le meilleur match selon les priorités (média d'abord, puis région)
    for (const mediaType of mediaTypes) {
      for (const region of regionPriority) {
        const normalizedRegion = region.toLowerCase()
        const found = cached.find(c => c.mediaType === mediaType && c.region === normalizedRegion && c.isValid)
        if (found && found.url !== '') {
          console.log(`📋 Batch Cache HIT: ${mediaType}(${region.toUpperCase()}) pour ${entityType}:${entityId}`)
          return found.url
        }
      }
    }
    
    // Fallback : chercher n'importe quel média valide dans le cache (peu importe la région)
    for (const mediaType of mediaTypes) {
      const found = cached.find(c => c.mediaType === mediaType && c.isValid && c.url !== '')
      if (found) {
        console.log(`📋 Fallback Cache HIT: ${mediaType}(${found.region.toUpperCase()}) pour ${entityType}:${entityId}`)
        return found.url
      }
    }
    
    // Fallback final : n'importe quel média valide disponible  
    const anyValid = cached.find(c => c.isValid && c.url !== '')
    if (anyValid) {
      console.log(`📋 Any Cache HIT: ${anyValid.mediaType}(${anyValid.region.toUpperCase()}) pour ${entityType}:${entityId}`)
      return anyValid.url
    }
    
    // Si rien en cache, faire des appels individuels seulement pour ce qui n'est pas en cache
    console.log(`🔄 Batch Cache MISS: Cherche ${mediaTypes.join(',')} pour ${entityType}:${entityId}`)
    
    for (const mediaType of mediaTypes) {
      for (const region of regionPriority) {
        // Vérifier si déjà en cache comme échec
        const normalizedRegion = region.toLowerCase()
        const cachedFailure = cached.find(c => c.mediaType === mediaType && c.region === normalizedRegion && !c.isValid)
        
        if (cachedFailure) {
          console.log(`⏭️  Skip ${mediaType}(${region}) - échec déjà en cache`)
          continue
        }
        
        const url = await getCachedMediaUrl(entityType, entityId, mediaType, region)
        if (url) {
          return url
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Erreur lors de la récupération optimisée:', error)
    return null
  }
}

/**
 * Récupère l'URL en cache ou la fetch depuis Screenscraper
 */
export async function getCachedMediaUrl(
  entityType: 'game' | 'console',
  entityId: string,
  mediaType: string,
  region: string = 'WOR'
): Promise<string | null> {
  try {
    // Normalize region to lowercase for consistent storage
    const normalizedRegion = region.toLowerCase()
    
    // Chercher en cache d'abord
    const cached = await prisma.mediaUrlCache.findFirst({
      where: {
        entityType,
        entityId,
        mediaType,
        region: normalizedRegion,
        expiresAt: {
          gte: new Date()
        }
      }
    })

    if (cached) {
      console.log(`📋 Cache HIT: ${mediaType} pour ${entityType}:${entityId}`)
      // Si c'est un échec mis en cache (url vide), retourner null
      return cached.url === '' ? null : cached.url
    }

    // Cache MISS - fetch depuis Screenscraper
    console.log(`🔄 Cache MISS: Fetching ${mediaType} pour ${entityType}:${entityId}`)
    
    const url = await fetchMediaFromScreenscraper(entityType, entityId, mediaType, region)
    
    // Récupérer le screenscrapeId approprié
    let screenscrapeId = 0
    if (entityType === 'console') {
      const consoleData = await prisma.console.findUnique({
        where: { id: entityId },
        select: { ssConsoleId: true }
      })
      screenscrapeId = consoleData?.ssConsoleId || 0
    } else if (entityType === 'game') {
      const gameData = await prisma.game.findUnique({
        where: { id: entityId },
        select: { ssGameId: true }
      })
      screenscrapeId = gameData?.ssGameId || 0
    }

    // Sauvegarder en cache (même si null pour éviter les appels répétés)
    const expiresAt = new Date(Date.now() + CACHE_DURATION_MS)
    
    await prisma.mediaUrlCache.upsert({
      where: {
        entityType_entityId_mediaType_region: {
          entityType,
          entityId,
          mediaType,
          region: normalizedRegion
        }
      },
      create: {
        entityType,
        entityId,
        mediaType,
        region: normalizedRegion,
        url: url || '', // Stocker chaîne vide si pas trouvé
        screenscrapeId,
        cachedAt: new Date(),
        expiresAt,
        isValid: url !== null
      },
      update: {
        url: url || '',
        screenscrapeId,
        cachedAt: new Date(),
        expiresAt,
        isValid: url !== null
      }
    })
    
    if (url) {
      console.log(`💾 URL mise en cache jusqu'au ${expiresAt.toLocaleString('fr-FR')}`)
    } else {
      console.log(`💾 Échec mis en cache (évite les appels futurs)`)
    }
    
    return url
    
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'URL média:', error)
    return null
  }
}

/**
 * Médias console qui n'ont pas de région (toujours WOR/global)
 */
const REGIONLESS_MEDIA_TYPES = ['minicon', 'icon', 'video', 'video-normalized']

/**
 * Consoles qui ne supportent pas certaines régions
 * Mapping console ID -> régions non supportées
 */
const CONSOLE_REGION_EXCLUSIONS: Record<string, string[]> = {
  // SuperGrafx n'a pas de région FR
  'pc-engine-supergrafx': ['fr']
}

/**
 * Fetch une URL média depuis Screenscraper avec rate limiting
 * Utilise l'API systemesListe pour récupérer les URLs des médias
 */
async function fetchMediaFromScreenscraper(
  entityType: 'game' | 'console',
  entityId: string,
  mediaType: string,
  region: string
): Promise<string | null> {
  try {
    // Vérifications préliminaires pour éviter les appels API inutiles
    
    // 1. Pour les médias console sans région, forcer la région à WOR
    if (entityType === 'console' && REGIONLESS_MEDIA_TYPES.includes(mediaType) && region !== 'wor') {
      console.log(`⚠️  Média ${mediaType} sans région - redirection vers WOR`)
      return null // Laisser le cache retry avec WOR
    }
    
    // 2. Vérifier les exclusions de région par console
    if (entityType === 'console' || entityType === 'game') {
      let consoleSlug = ''
      
      if (entityType === 'console') {
        const consoleData = await prisma.console.findUnique({
          where: { id: entityId },
          select: { slug: true }
        })
        consoleSlug = consoleData?.slug || ''
      } else {
        const gameData = await prisma.game.findUnique({
          where: { id: entityId },
          select: { console: { select: { slug: true } } }
        })
        consoleSlug = gameData?.console?.slug || ''
      }
      
      if (consoleSlug && CONSOLE_REGION_EXCLUSIONS[consoleSlug]?.includes(region.toLowerCase())) {
        console.log(`⚠️  Console ${consoleSlug} ne supporte pas la région ${region.toUpperCase()}`)
        return null // Éviter l'appel API
      }
    }

    // Rate limiting 1.2s
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    if (entityType === 'console') {
      // Pour les consoles, on doit d'abord trouver le ssConsoleId
      const gameConsole = await prisma.console.findUnique({
        where: { id: entityId },
        select: { ssConsoleId: true }
      })
      
      if (!gameConsole?.ssConsoleId) {
        console.log(`❌ Console ${entityId} sans ssConsoleId`)
        return null
      }
      
      const devId = process.env.SCREENSCRAPER_DEV_ID
      const devPassword = process.env.SCREENSCRAPER_DEV_PASSWORD
      
      if (!devId || !devPassword) {
        console.error('❌ Identifiants Screenscraper manquants')
        return null
      }
      
      // Utiliser l'API systemesListe pour récupérer les médias disponibles
      const url = `https://api.screenscraper.fr/api2/systemesListe.php?devid=${devId}&devpassword=${devPassword}&output=json`
      
      console.log(`🔄 Fetching media list pour système ${gameConsole.ssConsoleId}`)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        console.error(`❌ Erreur API Screenscraper: ${response.status}`)
        return null
      }
      
      const data = await response.json()
      
      if (!data.response?.systemes) {
        console.log(`❌ Réponse API invalide`)
        return null
      }
      
      // Trouver le système correspondant
      const system = data.response.systemes.find((s: any) => s.id === gameConsole.ssConsoleId)
      
      if (!system || !system.medias) {
        console.log(`❌ Système ${gameConsole.ssConsoleId} non trouvé ou sans médias`)
        return null
      }
      
      // Chercher le média demandé (priorité exacte puis fallback)
      const normalizedRegion = region.toLowerCase()
      
      // 1. Chercher correspondance exacte type + région
      let media = system.medias.find((m: any) => 
        m.type === mediaType && m.region === normalizedRegion
      )
      
      // 2. Fallback: même type, autres régions (ordre: wor, eu, us, jp)
      if (!media) {
        const fallbackRegions = ['wor', 'eu', 'us', 'jp', 'asi', 'br']
        for (const fallbackRegion of fallbackRegions) {
          media = system.medias.find((m: any) => 
            m.type === mediaType && m.region === fallbackRegion
          )
          if (media) break
        }
      }
      
      if (media && media.url) {
        console.log(`✅ URL média trouvée: ${media.type}(${media.region}) pour système ${gameConsole.ssConsoleId}`)
        return media.url
      } else {
        console.log(`❌ Média ${mediaType}(${normalizedRegion}) non trouvé pour système ${gameConsole.ssConsoleId}`)
        return null
      }
    }
    
    // TODO: Implémenter pour les jeux si nécessaire
    return null
    
  } catch (error) {
    console.error('❌ Erreur lors du fetch Screenscraper:', error)
    return null
  }
}

/**
 * Précharge les médias pour une liste d'entités (pour optimiser l'affichage des pages)
 */
export async function preloadBatchMediaUrls(
  items: Array<{
    entityType: 'game' | 'console'
    entityId: string
    mediaTypes?: string[]
    regions?: string[]
  }>
): Promise<void> {
  console.log(`🚀 Préchargement batch de ${items.length} entités`)
  
  const defaultConsoleMediaTypes = ['wheel', 'logo-svg', 'photo', 'illustration']
  const defaultGameMediaTypes = ['box-2D', 'box-3D', 'wheel', 'sstitle', 'ss']
  const defaultRegions = ['wor', 'eu', 'us', 'jp', 'fr', 'asi']
  
  // Traitement en parallèle mais avec rate limiting
  const promises = items.map(async (item, index) => {
    // Décalage pour le rate limiting
    await new Promise(resolve => setTimeout(resolve, index * 200))
    
    const mediaTypes = item.mediaTypes || (item.entityType === 'console' ? defaultConsoleMediaTypes : defaultGameMediaTypes)
    const regions = item.regions || defaultRegions
    
    try {
      await getBestCachedMediaUrl(item.entityType, item.entityId, mediaTypes, regions)
    } catch (error) {
      console.error(`Erreur préchargement pour ${item.entityType}:${item.entityId}`, error)
    }
  })
  
  await Promise.all(promises)
  console.log(`✅ Préchargement batch terminé`)
}

/**
 * Batch fetch pour plusieurs médias (utilisé lors du scraping initial)
 */
export async function cacheBatchMediaUrls(
  items: Array<{
    entityType: 'game' | 'console'
    entityId: string
    screenscrapeId: number
    mediaTypes: string[]
    regions: string[]
  }>
): Promise<void> {
  console.log(`🚀 Batch cache de ${items.length} entités`)
  
  for (const item of items) {
    for (const mediaType of item.mediaTypes) {
      for (const region of item.regions) {
        try {
          await getCachedMediaUrl(item.entityType, item.entityId, mediaType, region)
          
          // Rate limiting entre chaque appel
          await new Promise(resolve => setTimeout(resolve, 1200))
          
        } catch (error) {
          console.error(`Erreur batch pour ${item.entityType}:${item.entityId}`, error)
        }
      }
    }
  }
}

/**
 * Nettoie les entrées expirées du cache
 */
export async function cleanExpiredCache(): Promise<number> {
  const result = await prisma.mediaUrlCache.deleteMany({
    where: {
      expiresAt: {
        lte: new Date()
      }
    }
  })
  
  console.log(`🧹 ${result.count} entrées expirées supprimées du cache`)
  return result.count
}

/**
 * Statistiques du cache
 */
export async function getCacheStats(): Promise<{
  total: number
  expired: number
  byEntityType: Record<string, number>
  oldestEntry: Date | null
  hitRate?: number
}> {
  const total = await prisma.mediaUrlCache.count()
  
  const expired = await prisma.mediaUrlCache.count({
    where: {
      expiresAt: {
        lte: new Date()
      }
    }
  })
  
  const byEntityType = await prisma.mediaUrlCache.groupBy({
    by: ['entityType'],
    _count: {
      id: true
    }
  })
  
  const oldestEntry = await prisma.mediaUrlCache.findFirst({
    select: { cachedAt: true },
    orderBy: { cachedAt: 'asc' }
  })
  
  return {
    total,
    expired,
    byEntityType: byEntityType.reduce((acc, item) => {
      acc[item.entityType] = item._count.id
      return acc
    }, {} as Record<string, number>),
    oldestEntry: oldestEntry?.cachedAt || null
  }
}

/**
 * Stocke directement une URL dans le cache (utilisé lors du scraping)
 */
export async function setCachedMediaUrl(
  entityType: 'game' | 'console',
  entityId: string,
  mediaType: string,
  region: string,
  url: string
): Promise<void> {
  try {
    // Normalize region to lowercase for consistent storage
    const normalizedRegion = region.toLowerCase()
    const expiresAt = new Date(Date.now() + CACHE_DURATION_MS)
    
    await prisma.mediaUrlCache.upsert({
      where: {
        entityType_entityId_mediaType_region: {
          entityType,
          entityId,
          mediaType,
          region: normalizedRegion
        }
      },
      create: {
        entityType,
        entityId,
        mediaType,
        region: normalizedRegion,
        url,
        cachedAt: new Date(),
        expiresAt,
        isValid: true
      },
      update: {
        url,
        cachedAt: new Date(),
        expiresAt,
        isValid: true
      }
    })
  } catch (error) {
    console.error('Erreur lors de la mise en cache de l\'URL:', error)
    throw error
  }
}

/**
 * Supprime toutes les URLs en cache pour une entité
 */
export async function clearCachedMediaUrls(
  entityType: 'game' | 'console',
  entityId: string
): Promise<void> {
  try {
    await prisma.mediaUrlCache.deleteMany({
      where: {
        entityType,
        entityId
      }
    })
  } catch (error) {
    console.error('Erreur lors de la suppression du cache:', error)
    throw error
  }
}