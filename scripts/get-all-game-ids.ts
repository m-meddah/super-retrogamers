import { getAllGameIdsForAllSystems, saveGameIdsToFile } from '../lib/screenscraper-games'

async function getAllGameIds() {
  console.log('🎮 Début de la récupération des IDs de jeux pour toutes les consoles...')
  
  try {
    const gameIdsMap = await getAllGameIdsForAllSystems()
    
    // Sauvegarder dans un fichier JSON
    await saveGameIdsToFile(gameIdsMap)
    
    // Afficher les statistiques
    let totalGames = 0
    console.log('\n📊 Résultats par console:')
    
    for (const [systemId, gameIds] of gameIdsMap.entries()) {
      totalGames += gameIds.length
      console.log(`- Système ${systemId}: ${gameIds.length} jeux`)
    }
    
    console.log(`\n🎯 Total: ${totalGames} jeux trouvés pour ${gameIdsMap.size} consoles`)
    console.log('📁 Données sauvegardées dans screenscraper-game-ids.json')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

getAllGameIds()