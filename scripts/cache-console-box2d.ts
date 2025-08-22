import { prisma } from '@/lib/prisma'
import { cacheMediaUrl, buildScreenscraperMediaUrl } from '@/lib/cache-media-utils'

async function cacheConsoleBox2D(consoleSlug: string) {
  console.log(`=== Cache Box-2D Images for ${consoleSlug} ===`)
  
  // Get all games for this console
  const games = await prisma.game.findMany({
    where: {
      console: {
        slug: consoleSlug
      }
    },
    select: {
      id: true,
      title: true,
      ssGameId: true
    }
  })
  
  console.log(`Found ${games.length} games for ${consoleSlug}`)
  
  for (const game of games) {
    console.log(`\n--- Processing: ${game.title} ---`)
    
    if (!game.ssGameId) {
      console.log('❌ No ssGameId found')
      continue
    }
    
    // Check if box-2D already exists in cache
    const existingBox2D = await prisma.mediaUrlCache.findFirst({
      where: {
        entityType: 'game',
        entityId: game.id,
        mediaType: 'box-2D',
        region: 'jp',
        isValid: true
      }
    })
    
    if (existingBox2D) {
      console.log('✅ box-2D already in cache')
      continue
    }
    
    // Build the box-2D URL using the standardized function
    const box2DUrl = buildScreenscraperMediaUrl(105, game.ssGameId, 'box-2D', 'jp')
    
    console.log(`Creating cache entry for: ${box2DUrl}`)
    
    // Create cache entry using standardized function
    const success = await cacheMediaUrl(
      'game',
      game.id,
      'box-2D',
      'jp',
      box2DUrl,
      game.ssGameId
    )
    
    if (!success) {
      console.error('❌ Failed to cache media URL')
    }
    
    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1200))
  }
  
  await prisma.$disconnect()
  console.log('\n=== Done ===')
}

const consoleSlug = process.argv[2] || 'pc-engine-supergrafx'
cacheConsoleBox2D(consoleSlug).catch(console.error)