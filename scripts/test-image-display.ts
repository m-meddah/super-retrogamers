// Test script to check if anniversary images display correctly
import { getAnniversaryGames } from '@/lib/actions/anniversary-actions'
import { prisma } from '@/lib/prisma'

async function testImageDisplay() {
  console.log('=== Test Image Display ===')
  
  const games = await getAnniversaryGames('JP')
  console.log(`Testing ${games.length} games`)
  
  for (const game of games) {
    console.log(`\n--- ${game.title} ---`)
    
    // Get the same image the component would select
    const regionPriority = ['jp', 'wor', 'jp', 'eu', 'us', 'asi']
    const mediaTypePriority = [
      'box-2D', 'box-2D-back', 'box-2D-side', 'wheel-carbon', 
      'wheel-steel', 'screenmarquee', 'support-2D', 'mixrbv2'
    ]
    
    let imageUrl = null
    
    for (const mediaType of mediaTypePriority) {
      for (const r of regionPriority) {
        const cached = await prisma.mediaUrlCache.findFirst({
          where: {
            entityType: 'game',
            entityId: game.id,
            mediaType: mediaType,
            region: r,
            isValid: true,
            url: { not: '' }
          }
        })
        
        if (cached) {
          imageUrl = cached.url
          console.log(`Selected: ${mediaType} | ${r} | ${cached.url}`)
          break
        }
      }
      
      if (imageUrl) break
    }
    
    if (!imageUrl) {
      console.log('❌ No image found')
    }
  }
  
  await prisma.$disconnect()
}

testImageDisplay().catch(console.error)