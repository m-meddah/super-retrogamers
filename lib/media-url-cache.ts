'use server'

import { prisma } from '@/lib/prisma'

/**
 * Cache intelligent des URLs de médias Screenscraper
 * - Cache les URLs pendant 24h pour éviter le rate limiting
 * - Utilise directement les URLs Screenscraper sans téléchargement
 * - Invalidation automatique après expiration
 */

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
 * Récupère l'URL en cache ou la fetch depuis Screenscraper
 */
export async function getCachedMediaUrl(
  entityType: 'game' | 'console',
  entityId: string,
  mediaType: string,
  region: string = 'WOR'
): Promise<string | null> {
  try {
    // Chercher en cache d'abord
    const cached = await prisma.mediaUrlCache.findFirst({
      where: {
        entityType,
        entityId,
        mediaType,
        region,
        expiresAt: {
          gte: new Date()
        }
      }
    })

    if (cached) {
      console.log(`📋 Cache HIT: ${mediaType} pour ${entityType}:${entityId}`)
      return cached.url
    }

    // Cache MISS - fetch depuis Screenscraper
    console.log(`🔄 Cache MISS: Fetching ${mediaType} pour ${entityType}:${entityId}`)
    
    const url = await fetchMediaFromScreenscraper(entityType, entityId, mediaType, region)
    
    if (url) {
      // Sauvegarder en cache
      const expiresAt = new Date(Date.now() + CACHE_DURATION_MS)
      
      await prisma.mediaUrlCache.upsert({
        where: {
          entityType_entityId_mediaType_region: {
            entityType,
            entityId,
            mediaType,
            region
          }
        },
        create: {
          entityType,
          entityId,
          mediaType,
          region,
          url,
          screenscrapeId: 0, // Sera rempli si disponible
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
      
      console.log(`💾 URL mise en cache jusqu'au ${expiresAt.toLocaleString('fr-FR')}`)
    }
    
    return url
    
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'URL média:', error)
    return null
  }
}

/**
 * Fetch une URL média depuis Screenscraper avec rate limiting
 */
async function fetchMediaFromScreenscraper(
  entityType: 'game' | 'console',
  entityId: string,
  mediaType: string,
  region: string
): Promise<string | null> {
  // Implémentation Screenscraper avec rate limiting 1.2s
  await new Promise(resolve => setTimeout(resolve, 1200))
  
  // TODO: Implémenter l'appel réel à l'API Screenscraper
  // Pour l'instant, retourne null
  return null
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