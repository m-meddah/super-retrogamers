import { getGameIdsForSystem, saveGameIdsToFile } from '../lib/screenscraper-games'

async function testMultipleConsoles() {
  console.log('🎮 Test de récupération des IDs de jeux pour plusieurs consoles...')
  
  // IDs de consoles populaires sur Screenscraper
  const testConsoles = [
    { id: 1, name: 'Megadrive' },
    { id: 2, name: 'Master System' },
    { id: 3, name: 'NES' },
    { id: 4, name: 'Super Nintendo' },
    { id: 13, name: 'GameCube' },
    { id: 15, name: 'PlayStation' },
    { id: 58, name: 'PlayStation 2' }
  ]
  
  const gameIdsMap = new Map<number, number[]>()
  
  for (const consoleInfo of testConsoles) {
    console.log(`\n🔄 Traitement: ${consoleInfo.name} (ID: ${consoleInfo.id})`)
    
    try {
      const gameIds = await getGameIdsForSystem(consoleInfo.id)
      gameIdsMap.set(consoleInfo.id, gameIds)
      
      console.log(`✅ ${consoleInfo.name}: ${gameIds.length} jeux trouvés`)
      
      // Pause entre chaque console pour respecter les limites
      console.log('⏳ Pause de 2 secondes...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      console.error(`❌ Erreur pour ${consoleInfo.name}:`, error)
    }
  }
  
  // Sauvegarder tous les résultats
  await saveGameIdsToFile(gameIdsMap)
  
  // Statistiques finales
  let totalGames = 0
  console.log('\n📊 Résultats finaux:')
  
  for (const [systemId, gameIds] of gameIdsMap.entries()) {
    const consoleName = testConsoles.find(c => c.id === systemId)?.name || `Console ${systemId}`
    totalGames += gameIds.length
    console.log(`- ${consoleName}: ${gameIds.length} jeux`)
  }
  
  console.log(`\n🎯 Total: ${totalGames} jeux trouvés pour ${gameIdsMap.size} consoles`)
  console.log('📁 Données sauvegardées dans screenscraper-game-ids.json')
}

testMultipleConsoles().catch(console.error)