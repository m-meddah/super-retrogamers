import { prisma } from '@/lib/prisma'

async function fixScreenscrapeIdInCache() {
  console.log('🔧 Correction des screenscrapeId null dans media_url_cache...\n')

  // Trouver toutes les entrées de cache console avec screenscrapeId null
  const nullEntries = await prisma.mediaUrlCache.findMany({
    where: {
      entityType: 'console',
      screenscrapeId: null
    },
    select: {
      id: true,
      entityId: true,
      mediaType: true,
      region: true,
      url: true
    }
  })

  console.log(`📊 Entrées avec screenscrapeId NULL à corriger: ${nullEntries.length}`)

  let corrected = 0

  // Grouper par console pour éviter les requêtes répétées
  const entriesByConsole = new Map<string, typeof nullEntries>()
  
  for (const entry of nullEntries) {
    if (!entriesByConsole.has(entry.entityId)) {
      entriesByConsole.set(entry.entityId, [])
    }
    entriesByConsole.get(entry.entityId)!.push(entry)
  }

  console.log(`🎮 Consoles affectées: ${entriesByConsole.size}`)

  // Corriger chaque console
  for (const [consoleId, entries] of entriesByConsole) {
    // Récupérer le ssConsoleId de cette console
    const consoleData = await prisma.console.findUnique({
      where: { id: consoleId },
      select: { name: true, ssConsoleId: true }
    })

    if (!consoleData) {
      console.log(`⚠️  Console ${consoleId} introuvable`)
      continue
    }

    if (!consoleData.ssConsoleId) {
      console.log(`⚠️  Console ${consoleData.name} n'a pas de ssConsoleId`)
      continue
    }

    console.log(`🔄 Correction de ${consoleData.name} (${entries.length} entrées) -> ssConsoleId: ${consoleData.ssConsoleId}`)

    // Mettre à jour toutes les entrées de cette console
    for (const entry of entries) {
      await prisma.mediaUrlCache.update({
        where: { id: entry.id },
        data: { screenscrapeId: consoleData.ssConsoleId }
      })
      corrected++
    }
  }

  console.log(`\n✅ Correction terminée: ${corrected} entrées mises à jour`)

  // Vérification
  const remainingNull = await prisma.mediaUrlCache.count({
    where: {
      entityType: 'console',
      screenscrapeId: null
    }
  })

  console.log(`📊 Entrées console avec screenscrapeId NULL restantes: ${remainingNull}`)

  // Faire de même pour les jeux si nécessaire
  const gameNullEntries = await prisma.mediaUrlCache.count({
    where: {
      entityType: 'game',
      screenscrapeId: null
    }
  })

  if (gameNullEntries > 0) {
    console.log(`⚠️  Il reste ${gameNullEntries} entrées jeu avec screenscrapeId NULL`)
    console.log('   (Les jeux nécessitent une logique différente - pas implémentée pour l\'instant)')
  }
}

async function main() {
  try {
    await fixScreenscrapeIdInCache()
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()