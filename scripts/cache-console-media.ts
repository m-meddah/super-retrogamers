import { prisma } from '@/lib/prisma'

async function cacheConsoleMedia(consoleSlug: string) {
  console.log(`=== Cache Essential Media for ${consoleSlug} ===`)
  
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
  
  // Types de médias essentiels à mettre en cache
  const mediaTypes = [
    'box-2D',           // Pour les cards de jeu
    'wheel',            // Pour les logos
    'wheel-carbon',     // Logos alternatifs
    'wheel-steel',      // Logos alternatifs
    'screenmarquee',    // Fallback pour logos
    'logo-svg'          // Fallback pour logos
  ]
  
  for (const game of games) {
    console.log(`\n--- Processing: ${game.title} ---`)
    
    if (!game.ssGameId) {
      console.log('❌ No ssGameId found')
      continue
    }
    
    for (const mediaType of mediaTypes) {
      // Check if this media type already exists in cache
      const existingMedia = await prisma.mediaUrlCache.findFirst({
        where: {
          entityType: 'game',
          entityId: game.id,
          mediaType: mediaType,
          region: 'jp',
          isValid: true
        }
      })
      
      if (existingMedia) {
        console.log(`✅ ${mediaType} already in cache`)
        continue
      }
      
      // Build the media URL using the real ssGameId
      const mediaUrl = `https://neoclone.screenscraper.fr/api2/mediaJeu.php?devid=Fradz&devpassword=AGeJikPS7jZ&softname=super-retrogamers&ssid=&sspassword=&systemeid=105&jeuid=${game.ssGameId}&media=${mediaType}(jp)`
      
      console.log(`Creating cache entry for: ${mediaType}`)
      
      // Create cache entry
      try {
        await prisma.mediaUrlCache.create({
          data: {
            entityType: 'game',
            entityId: game.id,
            mediaType: mediaType,
            region: 'jp',
            url: mediaUrl,
            screenscrapeId: game.ssGameId,
            isValid: true,
            cachedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h from now
          }
        })
        console.log(`✅ ${mediaType} cache entry created`)
      } catch (error) {
        console.error(`❌ Error creating ${mediaType} cache entry:`, error)
      }
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    // Longer delay between games
    await new Promise(resolve => setTimeout(resolve, 1200))
  }
  
  await prisma.$disconnect()
  console.log('\n=== Done ===')
}

const consoleSlug = process.argv[2]
if (!consoleSlug) {
  console.log('Usage: npx tsx scripts/cache-console-media.ts <console-slug>')
  console.log('Example: npx tsx scripts/cache-console-media.ts pc-engine-supergrafx')
  process.exit(1)
}

cacheConsoleMedia(consoleSlug).catch(console.error)