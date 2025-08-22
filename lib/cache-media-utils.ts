import { prisma } from '@/lib/prisma'

/**
 * Cache standardisé pour les médias avec URL valide et screenscrapeId
 * Cette fonction doit être utilisée par TOUS les scripts de scraping
 */
export async function cacheMediaUrl(
  entityType: 'game' | 'console',
  entityId: string,
  mediaType: string,
  region: string,
  url: string,
  screenscrapeId: number
): Promise<boolean> {
  try {
    // Validation des paramètres
    if (!url || url.trim() === '') {
      console.log(`❌ URL vide pour ${mediaType} - pas de mise en cache`)
      return false
    }
    
    if (!screenscrapeId || screenscrapeId <= 0) {
      console.log(`❌ screenscrapeId invalide (${screenscrapeId}) pour ${mediaType} - pas de mise en cache`)
      return false
    }
    
    const normalizedRegion = region.toLowerCase()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    
    // Upsert pour créer ou mettre à jour l'entrée
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
        url: url.trim(),
        screenscrapeId,
        cachedAt: new Date(),
        expiresAt,
        isValid: true
      },
      update: {
        url: url.trim(),
        screenscrapeId,
        cachedAt: new Date(),
        expiresAt,
        isValid: true
      }
    })
    
    console.log(`✅ Média ${mediaType}(${region}) mis en cache pour ${entityType}:${entityId}`)
    return true
    
  } catch (error) {
    console.error(`❌ Erreur lors de la mise en cache de ${mediaType}:`, error)
    return false
  }
}

/**
 * Cache multiple médias en batch pour une entité
 */
export async function cacheMultipleMedias(
  entityType: 'game' | 'console',
  entityId: string,
  screenscrapeId: number,
  medias: Array<{
    mediaType: string
    region: string
    url: string
  }>
): Promise<number> {
  let cachedCount = 0
  
  for (const media of medias) {
    const success = await cacheMediaUrl(
      entityType,
      entityId,
      media.mediaType,
      media.region,
      media.url,
      screenscrapeId
    )
    
    if (success) {
      cachedCount++
    }
    
    // Petit délai pour éviter de surcharger la DB
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  
  console.log(`📊 ${cachedCount}/${medias.length} médias mis en cache pour ${entityType}:${entityId}`)
  return cachedCount
}

/**
 * Construire une URL de média Screenscraper standardisée
 */
export function buildScreenscraperMediaUrl(
  systemId: number,
  gameId: number,
  mediaType: string,
  region: string
): string {
  const devId = process.env.SCREENSCRAPER_DEV_ID
  const devPassword = process.env.SCREENSCRAPER_DEV_PASSWORD
  
  if (!devId || !devPassword) {
    throw new Error('Identifiants Screenscraper manquants')
  }
  
  return `https://neoclone.screenscraper.fr/api2/mediaJeu.php?devid=${devId}&devpassword=${devPassword}&softname=super-retrogamers&ssid=&sspassword=&systemeid=${systemId}&jeuid=${gameId}&media=${mediaType}(${region.toLowerCase()})`
}

/**
 * Nettoyer les entrées de cache invalides (URL vides ou screenscrapeId manquant)
 */
export async function cleanupInvalidCacheEntries(): Promise<number> {
  try {
    const result = await prisma.mediaUrlCache.deleteMany({
      where: {
        OR: [
          { url: '' },
          { isValid: false },
          { screenscrapeId: null }
        ]
      }
    })
    
    console.log(`🧹 ${result.count} entrées de cache invalides supprimées`)
    return result.count
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage du cache:', error)
    return 0
  }
}