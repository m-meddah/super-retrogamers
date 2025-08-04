import { NextResponse } from 'next/server'
import { getAllGameIdsForAllSystems, saveGameIdsToFile } from '@/lib/screenscraper-games'

export async function POST() {
  try {
    console.log('🎮 Début de la récupération des IDs de jeux...')
    
    const gameIdsMap = await getAllGameIdsForAllSystems()
    
    // Sauvegarder dans un fichier JSON
    await saveGameIdsToFile(gameIdsMap)
    
    // Calculer les statistiques
    let totalGames = 0
    const stats: Record<string, number> = {}
    
    for (const [systemId, gameIds] of gameIdsMap.entries()) {
      totalGames += gameIds.length
      stats[systemId.toString()] = gameIds.length
    }
    
    return NextResponse.json({
      success: true,
      message: `Récupération terminée avec succès`,
      totalSystems: gameIdsMap.size,
      totalGames,
      stats
    })
    
  } catch (error) {
    console.error('Erreur lors de la récupération des IDs de jeux:', error)
    return NextResponse.json(
      {
        success: false,
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      },
      { status: 500 }
    )
  }
}