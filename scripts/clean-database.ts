import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanDatabase() {
  console.log('🧹 Nettoyage de la base de données...')
  
  try {
    // Supprimer toutes les données liées aux consoles
    await prisma.userConsoleCollection.deleteMany()
    await prisma.userGameCollection.deleteMany() 
    await prisma.userWishlist.deleteMany()
    await prisma.gameReview.deleteMany()
    await prisma.consoleMedia.deleteMany()
    await prisma.game.deleteMany()
    await prisma.consoleVariant.deleteMany()
    await prisma.console.deleteMany()
    
    console.log('✅ Base de données nettoyée avec succès')
    console.log('Vous pouvez maintenant relancer le scraping avec les nouveaux critères')
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanDatabase()