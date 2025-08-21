import { getAnniversaryGames } from '@/lib/actions/anniversary-actions'

async function testAnniversaryNow() {
  console.log('🎉 Test des anniversaires avec la simulation...\n')

  const games = await getAnniversaryGames('FR')
  
  console.log(`📊 Jeux anniversaire trouvés: ${games.length}`)
  
  for (const game of games) {
    console.log(`\n🎮 ${game.title}`)
    console.log(`   Console: ${game.console?.name}`)
    console.log(`   Anniversaire: ${game.anniversary}`)
    console.log(`   Région: ${game.releaseRegion}`)
    console.log(`   Date: ${game.releaseDate ? new Date(game.releaseDate).toLocaleDateString('fr-FR') : 'null'}`)
  }
  
  if (games.length > 0) {
    console.log('\n✅ Le composant devrait maintenant s\'afficher sur la homepage !')
  } else {
    console.log('\n❌ Aucun anniversaire trouvé - vérifiez la simulation')
  }
}

testAnniversaryNow()