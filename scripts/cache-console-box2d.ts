import { prisma } from '@/lib/prisma'

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
    
    // Build the box-2D URL using the real ssGameId
    const box2DUrl = `https://neoclone.screenscraper.fr/api2/mediaJeu.php?devid=Fradz&devpassword=AGeJikPS7jZ&softname=super-retrogamers&ssid=&sspassword=&systemeid=105&jeuid=${game.ssGameId}&media=box-2D(jp)`
    
    console.log(`Creating cache entry for: ${box2DUrl}`)
    
    // Create cache entry
    try {
      await prisma.mediaUrlCache.create({
        data: {
          entityType: 'game',
          entityId: game.id,
          mediaType: 'box-2D',
          region: 'jp',
          url: box2DUrl,
          isValid: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h from now
        }
      })
      console.log('✅ Cache entry created')
    } catch (error) {
      console.error('❌ Error creating cache entry:', error)
    }
    
    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1200))
  }
  
  await prisma.$disconnect()
  console.log('\n=== Done ===')
}

const consoleSlug = process.argv[2] || 'pc-engine-supergrafx'
cacheConsoleBox2D(consoleSlug).catch(console.error)