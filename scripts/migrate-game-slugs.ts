import { prisma } from '@/lib/prisma'

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
}

async function migrateGameSlugs() {
  console.log('🔄 Migration des slugs de jeux...')
  
  try {
    // Get all games with their console information
    const games = await prisma.game.findMany({
      include: {
        console: true
      }
    })
    
    console.log(`📊 ${games.length} jeux à migrer`)
    
    let migratedCount = 0
    let skippedCount = 0
    
    for (const game of games) {
      if (!game.console) {
        console.log(`⚠️  Jeu sans console: ${game.title} (ID: ${game.id})`)
        skippedCount++
        continue
      }
      
      // Create new slug format: console-slug-game-slug
      const gameSlug = createSlug(game.title)
      const newSlug = `${game.console.slug}-${gameSlug}`
      
      // Check if the new slug would be different
      if (game.slug === newSlug) {
        console.log(`✅ Slug déjà correct: ${game.title} -> ${newSlug}`)
        continue
      }
      
      // Check if new slug already exists
      const existingGame = await prisma.game.findUnique({
        where: { slug: newSlug }
      })
      
      if (existingGame && existingGame.id !== game.id) {
        console.log(`⚠️  Conflit de slug: ${newSlug} existe déjà pour le jeu ${existingGame.title}`)
        // Add a number suffix to make it unique
        let counter = 2
        let uniqueSlug = `${newSlug}-${counter}`
        
        while (await prisma.game.findUnique({ where: { slug: uniqueSlug } })) {
          counter++
          uniqueSlug = `${newSlug}-${counter}`
        }
        
        console.log(`🔧 Utilisation du slug unique: ${uniqueSlug}`)
        
        await prisma.game.update({
          where: { id: game.id },
          data: { slug: uniqueSlug }
        })
      } else {
        // Update the game with new slug
        await prisma.game.update({
          where: { id: game.id },
          data: { slug: newSlug }
        })
      }
      
      console.log(`🔄 Migré: ${game.title} (${game.console.name})`)
      console.log(`   Ancien slug: ${game.slug}`)
      console.log(`   Nouveau slug: ${newSlug}`)
      
      migratedCount++
    }
    
    console.log(`\n✅ Migration terminée!`)
    console.log(`   - Jeux migrés: ${migratedCount}`)
    console.log(`   - Jeux ignorés: ${skippedCount}`)
    console.log(`   - Total: ${games.length}`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Execute migration
migrateGameSlugs()
  .then(() => {
    console.log('🎉 Migration des slugs terminée avec succès!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })