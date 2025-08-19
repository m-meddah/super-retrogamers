#!/usr/bin/env tsx

/**
 * Script pour calculer les économies de stockage avec le système de cache d'URLs
 */

interface StorageCalculation {
  gameCount: number
  mediaTypesPerGame: number
  averageImageSize: number // en KB
  totalSizeGB: number
  monthlyStorageCost: number
  yearlyStorageCost: number
}

function calculateStorageCosts(gameCount: number): {
  withLocalStorage: StorageCalculation
  withUrlCache: StorageCalculation
  savings: {
    storageGB: number
    monthlyCost: number
    yearlyCost: number
    percentageSaved: number
  }
} {
  // Stockage local traditionnel
  const mediaTypesPerGame = 14 // box-2D, wheel, screenshots, etc.
  const averageImageSize = 200 // KB par image
  
  const localStorage: StorageCalculation = {
    gameCount,
    mediaTypesPerGame,
    averageImageSize,
    totalSizeGB: (gameCount * mediaTypesPerGame * averageImageSize) / (1024 * 1024), // Convert KB to GB
    monthlyStorageCost: 0,
    yearlyStorageCost: 0
  }
  
  // Coûts de stockage (exemple Vercel/Netlify)
  const costPerGBPerMonth = 10 // €/GB/mois approximatif
  localStorage.monthlyStorageCost = localStorage.totalSizeGB * costPerGBPerMonth
  localStorage.yearlyStorageCost = localStorage.monthlyStorageCost * 12

  // Système de cache d'URLs
  const urlCacheSize = 0.1 // GB - juste les URLs en base, pas les images
  const urlCache: StorageCalculation = {
    gameCount,
    mediaTypesPerGame,
    averageImageSize: 0, // Pas de stockage d'images
    totalSizeGB: urlCacheSize,
    monthlyStorageCost: urlCacheSize * costPerGBPerMonth,
    yearlyStorageCost: urlCacheSize * costPerGBPerMonth * 12
  }

  // Calcul des économies
  const savings = {
    storageGB: localStorage.totalSizeGB - urlCache.totalSizeGB,
    monthlyCost: localStorage.monthlyStorageCost - urlCache.monthlyStorageCost,
    yearlyCost: localStorage.yearlyStorageCost - urlCache.yearlyStorageCost,
    percentageSaved: ((localStorage.monthlyStorageCost - urlCache.monthlyStorageCost) / localStorage.monthlyStorageCost) * 100
  }

  return {
    withLocalStorage: localStorage,
    withUrlCache: urlCache,
    savings
  }
}

async function generateStorageReport() {
  console.log('💰 Rapport d\'économies de stockage avec cache d\'URLs\n')
  console.log('=' * 60)

  // Différents scénarios
  const scenarios = [
    { name: 'Base actuelle', games: 100 },
    { name: 'Objectif court terme', games: 1000 },
    { name: 'Objectif moyen terme', games: 10000 },
    { name: 'Objectif long terme', games: 50000 },
    { name: 'Collection complète', games: 100000 }
  ]

  for (const scenario of scenarios) {
    console.log(`\n📊 Scénario: ${scenario.name} (${scenario.games.toLocaleString('fr-FR')} jeux)`)
    console.log('-'.repeat(50))
    
    const calculation = calculateStorageCosts(scenario.games)
    
    console.log('🗄️  Stockage local traditionnel:')
    console.log(`   • Taille totale: ${calculation.withLocalStorage.totalSizeGB.toFixed(1)} GB`)
    console.log(`   • Coût mensuel: ${calculation.withLocalStorage.monthlyStorageCost.toFixed(0)}€`)
    console.log(`   • Coût annuel: ${calculation.withLocalStorage.yearlyStorageCost.toFixed(0)}€`)
    
    console.log('\n☁️  Cache d\'URLs externes:')
    console.log(`   • Taille totale: ${calculation.withUrlCache.totalSizeGB.toFixed(1)} GB`)
    console.log(`   • Coût mensuel: ${calculation.withUrlCache.monthlyStorageCost.toFixed(0)}€`)
    console.log(`   • Coût annuel: ${calculation.withUrlCache.yearlyStorageCost.toFixed(0)}€`)
    
    console.log('\n💡 Économies réalisées:')
    console.log(`   • Stockage économisé: ${calculation.savings.storageGB.toFixed(1)} GB`)
    console.log(`   • Économie mensuelle: ${calculation.savings.monthlyCost.toFixed(0)}€`)
    console.log(`   • Économie annuelle: ${calculation.savings.yearlyCost.toFixed(0)}€`)
    console.log(`   • Pourcentage d'économie: ${calculation.savings.percentageSaved.toFixed(1)}%`)
    
    // Calcul du ROI sur le développement
    const developmentCostHours = 8 // heures pour implémenter le système
    const hourlyRate = 50 // €/heure
    const developmentCost = developmentCostHours * hourlyRate
    const paybackMonths = developmentCost / calculation.savings.monthlyCost
    
    console.log(`\n📈 ROI du développement:`)
    console.log(`   • Coût de développement estimé: ${developmentCost}€`)
    console.log(`   • Retour sur investissement: ${paybackMonths.toFixed(1)} mois`)
  }

  // Avantages supplémentaires
  console.log('\n🚀 Avantages supplémentaires du cache d\'URLs:')
  console.log('   ✅ Pas de téléchargement initial massif')
  console.log('   ✅ Images toujours à jour depuis Screenscraper')
  console.log('   ✅ Pas de gestion de l\'espace disque')
  console.log('   ✅ Pas de problèmes de synchronisation')
  console.log('   ✅ Réduction de la charge serveur')
  console.log('   ✅ Cache intelligent avec expiration')
  console.log('   ✅ Rate limiting automatique')

  console.log('\n⚠️  Considérations:')
  console.log('   • Dépendance à la disponibilité de Screenscraper')
  console.log('   • Latence possible sur le premier chargement')
  console.log('   • Nécessite une bonne stratégie de fallback')
  console.log('   • Cache 24h pour respecter les limites API')

  console.log('\n📊 Métriques de performance du cache:')
  try {
    const { getCacheStats } = await import('@/lib/media-url-cache')
    const stats = await getCacheStats()
    
    console.log(`   • Entrées en cache: ${stats.total}`)
    console.log(`   • Entrées expirées: ${stats.expired}`)
    console.log(`   • Types d'entités: ${Object.keys(stats.byEntityType).join(', ')}`)
    
    if (stats.total > 0) {
      const hitRate = ((stats.total - stats.expired) / stats.total) * 100
      console.log(`   • Taux de succès du cache: ${hitRate.toFixed(1)}%`)
    }
  } catch (error) {
    console.log('   • Impossible de récupérer les stats (DB non connectée)')
  }

  console.log('\n✨ Conclusion: Le système de cache d\'URLs est TRÈS rentable!')
  console.log('   💡 Économies massives dès 1000+ jeux')
  console.log('   🚀 ROI atteint en moins de 3 mois pour 10k+ jeux')
  console.log('   📈 Scalabilité quasi-illimitée sans coûts additionnels')
}

// Exécuter le rapport si le script est appelé directement
if (require.main === module) {
  generateStorageReport()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erreur lors de la génération du rapport:', error)
      process.exit(1)
    })
}

export { calculateStorageCosts, generateStorageReport }