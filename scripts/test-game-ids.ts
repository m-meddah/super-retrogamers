import { getGameIdsForSystem } from '../lib/screenscraper-games'

async function testGameIds() {
  console.log('🧪 Test de récupération des IDs de jeux pour GameCube (ID: 13)')
  
  const gameIds = await getGameIdsForSystem(13)
  
  console.log(`\n📊 Résultats:`)
  console.log(`- Nombre de jeux trouvés: ${gameIds.length}`)
  console.log(`- Premiers IDs: ${gameIds.slice(0, 10).join(', ')}`)
  
  if (gameIds.length > 10) {
    console.log(`- Derniers IDs: ${gameIds.slice(-10).join(', ')}`)
  }
}

testGameIds().catch(console.error)