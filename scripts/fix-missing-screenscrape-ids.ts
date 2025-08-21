import { prisma } from '@/lib/prisma'

async function fixMissingScreenscrapeIds() {
  console.log('=== Fix Missing screenscrapeId in MediaUrlCache ===')
  
  // Get all media cache entries without screenscrapeId
  const entriesWithoutId = await prisma.mediaUrlCache.findMany({
    where: {
      screenscrapeId: null
    },
    select: {
      id: true,
      entityType: true,
      entityId: true,
      mediaType: true,
      region: true
    }
  })
  
  console.log(`Found ${entriesWithoutId.length} entries without screenscrapeId`)
  
  let gamesUpdated = 0
  let consolesUpdated = 0
  
  for (const entry of entriesWithoutId) {
    if (entry.entityType === 'game') {
      // Get the game's ssGameId
      const game = await prisma.game.findUnique({
        where: { id: entry.entityId },
        select: { ssGameId: true, title: true }
      })
      
      if (game?.ssGameId) {
        await prisma.mediaUrlCache.update({
          where: { id: entry.id },
          data: { screenscrapeId: game.ssGameId }
        })
        console.log(`✅ Updated game "${game.title}" media ${entry.mediaType} with ssGameId: ${game.ssGameId}`)
        gamesUpdated++
      } else {
        console.log(`❌ No ssGameId found for game ${entry.entityId}`)
      }
    } else if (entry.entityType === 'console') {
      // Get the console's ssConsoleId
      const console = await prisma.console.findUnique({
        where: { id: entry.entityId },
        select: { ssConsoleId: true, name: true }
      })
      
      if (console?.ssConsoleId) {
        await prisma.mediaUrlCache.update({
          where: { id: entry.id },
          data: { screenscrapeId: console.ssConsoleId }
        })
        console.log(`✅ Updated console "${console.name}" media ${entry.mediaType} with ssConsoleId: ${console.ssConsoleId}`)
        consolesUpdated++
      } else {
        console.log(`❌ No ssConsoleId found for console ${entry.entityId}`)
      }
    }
    
    // Small delay to avoid overwhelming the DB
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  
  console.log(`\n=== Summary ===`)
  console.log(`Games updated: ${gamesUpdated}`)
  console.log(`Consoles updated: ${consolesUpdated}`)
  console.log(`Total updated: ${gamesUpdated + consolesUpdated}`)
  
  await prisma.$disconnect()
}

fixMissingScreenscrapeIds().catch(console.error)