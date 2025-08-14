const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkRegionalData() {
  try {
    console.log('=== Vérification des données régionales ===')
    
    // Vérifier la console Megadrive
    const megadrive = await prisma.console.findFirst({
      where: { slug: 'megadrive' },
      include: {
        regionalNames: true,
        regionalDates: true
      }
    })
    
    if (!megadrive) {
      console.log('❌ Console Megadrive non trouvée')
      return
    }
    
    console.log('\n📱 Console Megadrive:')
    console.log(`ID: ${megadrive.id}`)
    console.log(`Nom par défaut: ${megadrive.name}`)
    console.log(`Screenscraper ID: ${megadrive.screenscrapeId}`)
    
    console.log('\n🌍 Noms régionaux:')
    if (megadrive.regionalNames.length === 0) {
      console.log('❌ Aucun nom régional trouvé')
    } else {
      megadrive.regionalNames.forEach(name => {
        console.log(`  ${name.region}: ${name.name}`)
      })
    }
    
    console.log('\n📅 Dates régionales:')
    if (megadrive.regionalDates.length === 0) {
      console.log('❌ Aucune date régionale trouvée')
    } else {
      megadrive.regionalDates.forEach(date => {
        console.log(`  ${date.region}: ${date.releaseDate}`)
      })
    }
    
    // Vérifier toutes les consoles avec screenscrapeId
    const consolesWithScreenscrapeId = await prisma.console.count({
      where: {
        screenscrapeId: { not: null }
      }
    })
    
    const consolesWithRegionalNames = await prisma.console.count({
      where: {
        regionalNames: {
          some: {}
        }
      }
    })
    
    console.log(`\n📊 Statistiques:`)
    console.log(`Consoles avec screenscrapeId: ${consolesWithScreenscrapeId}`)
    console.log(`Consoles avec noms régionaux: ${consolesWithRegionalNames}`)
    
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRegionalData()