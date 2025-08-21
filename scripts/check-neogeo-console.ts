import { prisma } from '@/lib/prisma'

async function checkNeoGeoConsole() {
  console.log('🔍 Vérification de la console Neo Geo...\n')

  // Chercher Neo Geo par nom ou slug
  const neoGeoConsoles = await prisma.console.findMany({
    where: {
      OR: [
        { name: { contains: 'Neo Geo', mode: 'insensitive' } },
        { name: { contains: 'NeoGeo', mode: 'insensitive' } },
        { slug: { contains: 'neo-geo', mode: 'insensitive' } },
        { ssConsoleId: 142 }
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true,
      ssConsoleId: true,
      createdAt: true
    }
  })

  if (neoGeoConsoles.length === 0) {
    console.log('❌ Aucune console Neo Geo trouvée dans la base')
    return
  }

  console.log(`📦 Consoles Neo Geo trouvées (${neoGeoConsoles.length}):`)
  for (const gameConsole of neoGeoConsoles) {
    console.log(`  - ${gameConsole.name} (${gameConsole.slug})`)
    console.log(`    ID: ${gameConsole.id}`)
    console.log(`    ssConsoleId: ${gameConsole.ssConsoleId || 'NULL'}`)
    console.log(`    Créée le: ${gameConsole.createdAt.toLocaleString('fr-FR')}`)
    console.log()

    // Vérifier les entrées de cache pour cette console
    const cacheEntries = await prisma.mediaUrlCache.findMany({
      where: {
        entityType: 'console',
        entityId: gameConsole.id
      },
      select: {
        mediaType: true,
        region: true,
        url: true,
        screenscrapeId: true,
        isValid: true,
        cachedAt: true
      },
      orderBy: [
        { mediaType: 'asc' },
        { region: 'asc' }
      ]
    })

    console.log(`    📋 Entrées cache (${cacheEntries.length}):`)
    if (cacheEntries.length === 0) {
      console.log('      Aucune entrée de cache')
    } else {
      for (const entry of cacheEntries) {
        const status = entry.isValid ? '✅' : '❌'
        console.log(`      ${status} ${entry.mediaType}(${entry.region.toUpperCase()}) - screenscrapeId: ${entry.screenscrapeId || 'NULL'} - ${entry.cachedAt.toLocaleString('fr-FR')}`)
      }
    }
    console.log()
  }

  // Vérifier s'il y a des entrées de cache avec screenscrapeId null
  const nullScreenscrapeIdEntries = await prisma.mediaUrlCache.findMany({
    where: {
      entityType: 'console',
      screenscrapeId: null
    },
    select: {
      entityId: true,
      mediaType: true,
      region: true,
      url: true,
      screenscrapeId: true
    }
  })

  console.log(`⚠️  Entrées de cache avec screenscrapeId NULL (${nullScreenscrapeIdEntries.length}):`)
  for (const entry of nullScreenscrapeIdEntries) {
    // Récupérer les infos de console
    const consoleInfo = await prisma.console.findUnique({
      where: { id: entry.entityId },
      select: { name: true, slug: true, ssConsoleId: true }
    })
    
    console.log(`  - Console: ${consoleInfo?.name || 'Inconnue'} (ssConsoleId: ${consoleInfo?.ssConsoleId || 'NULL'})`)
    console.log(`    Média: ${entry.mediaType}(${entry.region.toUpperCase()})`)
    console.log(`    URL: ${entry.url || 'VIDE'}`)
    console.log()
  }
}

async function main() {
  try {
    await checkNeoGeoConsole()
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()