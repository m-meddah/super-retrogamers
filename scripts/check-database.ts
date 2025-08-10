/**
 * Script pour vérifier l'état de la base de données
 * Usage: npx tsx scripts/check-database.ts
 */

import { prisma } from '../lib/prisma'

async function checkDatabase() {
  try {
    console.log('🔍 Vérification de la base de données...')
    console.log('')
    
    // Statistiques générales
    const [
      consoleCount,
      gameCount,
      userCount,
      variantCount,
      collectionCount,
      wishlistCount,
    ] = await Promise.all([
      prisma.console.count(),
      prisma.game.count(),
      prisma.user.count(),
      prisma.consoleVariant.count(),
      prisma.userConsoleCollection.count(),
      prisma.userWishlist.count(),
    ])
    
    console.log('📊 Statistiques générales:')
    console.log(`   - Consoles: ${consoleCount}`)
    console.log(`   - Jeux: ${gameCount}`)
    console.log(`   - Utilisateurs: ${userCount}`)
    console.log(`   - Variants de consoles: ${variantCount}`)
    console.log(`   - Éléments en collection: ${collectionCount}`)
    console.log(`   - Éléments en wishlist: ${wishlistCount}`)
    console.log('')
    
    // Vérification des administrateurs
    const adminCount = await prisma.user.count({
      where: { role: 'admin' }
    })
    
    console.log(`👑 Administrateurs: ${adminCount}`)
    if (adminCount > 0) {
      const admins = await prisma.user.findMany({
        where: { role: 'admin' },
        select: { email: true, name: true, createdAt: true }
      })
      
      admins.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.name}) - Créé le ${admin.createdAt.toLocaleDateString()}`)
      })
    } else {
      console.log('   ⚠️  Aucun administrateur trouvé!')
      console.log('   💡 Utilisez: npx tsx scripts/create-admin.ts <email> <password>')
    }
    console.log('')
    
    // Vérification des variants
    if (consoleCount > 0 && variantCount === 0) {
      console.log('⚠️  Aucun variant de console trouvé!')
      console.log('   💡 Utilisez: npx tsx scripts/generate-console-variants.ts')
    } else if (consoleCount > 0) {
      const avgVariants = (variantCount / consoleCount).toFixed(1)
      console.log(`📊 Moyenne de ${avgVariants} variants par console`)
      
      // Top 5 des consoles avec le plus de variants
      const consolesWithVariants = await prisma.console.findMany({
        include: {
          _count: {
            select: { variants: true }
          }
        },
        orderBy: {
          variants: {
            _count: 'desc'
          }
        },
        take: 5
      })
      
      console.log('🏆 Top 5 des consoles avec le plus de variants:')
      consolesWithVariants.forEach((consoleItem, index) => {
        console.log(`   ${index + 1}. ${consoleItem.name}: ${consoleItem._count.variants} variants`)
      })
    }
    console.log('')
    
    // Vérification de la connexion
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Connexion à la base de données OK')
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()