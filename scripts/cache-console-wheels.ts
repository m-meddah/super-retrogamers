import { prisma } from '@/lib/prisma'
import { cacheMediaUrl, buildScreenscraperMediaUrl } from '@/lib/cache-media-utils'

async function cacheConsoleWheels(consoleSlug: string) {
  console.log(`=== Cache Wheel Logos for ${consoleSlug} ===`)
  
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
  
  // Types de wheel à mettre en cache
  const wheelTypes = ['wheel', 'wheel-carbon', 'wheel-steel']
  
  for (const game of games) {
    console.log(`\n--- Processing: ${game.title} ---`)
    
    if (!game.ssGameId) {
      console.log('❌ No ssGameId found')
      continue
    }
    
    for (const wheelType of wheelTypes) {
      // Check if this wheel type already exists in cache
      const existingWheel = await prisma.mediaUrlCache.findFirst({
        where: {
          entityType: 'game',
          entityId: game.id,
          mediaType: wheelType,
          region: 'jp',
          isValid: true
        }
      })
      
      if (existingWheel) {
        console.log(`✅ ${wheelType} already in cache`)
        continue
      }
      
      // Build the wheel URL using the standardized function
      const wheelUrl = buildScreenscraperMediaUrl(105, game.ssGameId, wheelType, 'jp')
      
      console.log(`Creating cache entry for: ${wheelType}`)
      
      // Create cache entry using standardized function
      const success = await cacheMediaUrl(
        'game',
        game.id,
        wheelType,
        'jp',
        wheelUrl,
        game.ssGameId
      )
      
      if (!success) {
        console.error(`❌ Failed to cache ${wheelType} URL`)
      }
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    // Longer delay between games
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  await prisma.$disconnect()
  console.log('\n=== Done ===')
}

const consoleSlug = process.argv[2] || 'pc-engine-supergrafx'
cacheConsoleWheels(consoleSlug).catch(console.error)