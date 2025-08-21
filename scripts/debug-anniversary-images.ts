import { prisma } from '@/lib/prisma'
import { getAnniversaryGames } from '@/lib/actions/anniversary-actions'

async function debugAnniversaryImages() {
  console.log('=== Debug Anniversary Images ===')
  
  // Get anniversary games
  const games = await getAnniversaryGames('JP')
  console.log(`Found ${games.length} anniversary games`)
  
  for (const game of games) {
    console.log(`\n--- Game: ${game.title} (ID: ${game.id}) ---`)
    
    // Get all cached media for this game
    const cachedMedia = await prisma.mediaUrlCache.findMany({
      where: {
        entityType: 'game',
        entityId: game.id,
        isValid: true,
        url: { not: '' }
      },
      orderBy: [
        { mediaType: 'asc' },
        { region: 'asc' }
      ]
    })
    
    console.log(`Found ${cachedMedia.length} cached media entries:`)
    
    cachedMedia.forEach(media => {
      console.log(`  - ${media.mediaType} | ${media.region} | ${media.url ? 'URL OK' : 'NO URL'} | Valid: ${media.isValid}`)
    })
    
    // Check specifically for box-2D media
    const box2DMedia = cachedMedia.filter(m => m.mediaType === 'box-2D')
    console.log(`\nBox-2D media found: ${box2DMedia.length}`)
    box2DMedia.forEach(media => {
      console.log(`  - box-2D | ${media.region} | ${media.url}`)
    })
    
    // Check what image the component would select
    const regionPriority = ['jp', 'wor', 'jp', 'eu', 'us', 'asi']
    const mediaTypePriority = [
      'box-2D', 'box-2D-back', 'box-2D-side', 'screenmarquee', 
      'wheel-carbon', 'wheel-steel', 'support-2D', 'mixrbv2'
    ]
    
    let selectedImage = null
    for (const mediaType of mediaTypePriority) {
      for (const r of regionPriority) {
        const found = cachedMedia.find(m => 
          m.mediaType === mediaType && 
          m.region === r && 
          m.isValid && 
          m.url
        )
        if (found) {
          selectedImage = found
          break
        }
      }
      if (selectedImage) break
    }
    
    console.log(`\nSelected image: ${selectedImage ? `${selectedImage.mediaType} | ${selectedImage.region} | ${selectedImage.url}` : 'NONE'}`)
  }
  
  await prisma.$disconnect()
}

debugAnniversaryImages().catch(console.error)