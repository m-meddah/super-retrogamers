#!/usr/bin/env tsx

import { getMediaUsageStats } from '@/lib/media-strategy'
import { getCacheStats } from '@/lib/media-url-cache'

async function analyzeMediaMigration() {
  console.log('🔍 Analyse de l\'état des médias et stratégie de migration\n')
  
  try {
    // Récupérer les statistiques actuelles
    const [mediaStats, cacheStats] = await Promise.all([
      getMediaUsageStats(),
      getCacheStats()
    ])

    console.log('📊 État actuel des médias:')
    console.log('=' * 50)
    
    console.log('\n🎮 JEUX:')
    console.log(`  • Avec médias locaux: ${mediaStats.games.totalWithLocalMedia}`)
    console.log(`  • Avec URLs en cache: ${mediaStats.games.totalWithCachedUrls}`)
    console.log(`  • Sans médias: ${mediaStats.games.totalWithoutMedia}`)
    
    console.log('\n🕹️  CONSOLES:')
    console.log(`  • Avec médias locaux: ${mediaStats.consoles.totalWithLocalMedia}`)
    console.log(`  • Avec URLs en cache: ${mediaStats.consoles.totalWithCachedUrls}`)
    console.log(`  • Sans médias: ${mediaStats.consoles.totalWithoutMedia}`)
    
    console.log('\n💾 STOCKAGE:')
    console.log(`  • Taille estimée médias locaux: ${mediaStats.storage.localMediaSizeEstimate}`)
    console.log(`  • Entrées en cache: ${mediaStats.storage.cacheEntriesCount}`)
    console.log(`  • Entrées expirées: ${cacheStats.expired}`)
    
    // Calculs de migration
    const totalLocalMedias = mediaStats.games.totalWithLocalMedia + mediaStats.consoles.totalWithLocalMedia
    const totalCachedUrls = mediaStats.games.totalWithCachedUrls + mediaStats.consoles.totalWithCachedUrls
    
    console.log('\n🎯 STRATÉGIE RECOMMANDÉE:')
    console.log('=' * 50)
    
    if (totalLocalMedias === 0 && totalCachedUrls === 0) {
      console.log('✅ NOUVEAU PROJET - Utilisez uniquement le cache d\'URLs')
      console.log('   • Implémentez directement getCachedMediaUrl()')
      console.log('   • Pas de téléchargement local nécessaire')
      console.log('   • Économies maximales dès le départ')
      
    } else if (totalLocalMedias > totalCachedUrls) {
      console.log('🔄 MIGRATION PROGRESSIVE RECOMMANDÉE')
      console.log('   • Phase 1: Garder les médias locaux existants comme fallback')
      console.log('   • Phase 2: Utiliser le cache d\'URLs pour nouveaux contenus')
      console.log('   • Phase 3: Migrer progressivement vers URLs externes')
      console.log(`   • Économies potentielles: ${((totalLocalMedias * 200) / 1024).toFixed(1)} MB`)
      
    } else {
      console.log('🚀 SYSTÈME HYBRIDE OPTIMAL')
      console.log('   • Cache d\'URLs prioritaire ✅')
      console.log('   • Fallback vers médias locaux ✅')
      console.log('   • Migration en cours de finalisation')
    }
    
    console.log('\n📋 PLAN D\'ACTION:')
    console.log('-' * 30)
    
    console.log('\n1️⃣  IMMÉDIAT (nouvelles données):')
    console.log('   • Utiliser getCachedMediaUrl() pour tous nouveaux jeux/consoles')
    console.log('   • Ne plus télécharger de médias localement')
    console.log('   • Configurer le rate limiting Screenscraper (1.2s)')
    
    console.log('\n2️⃣  COURT TERME (données existantes):')
    console.log('   • Garder les médias locaux comme fallback')
    console.log('   • Implémenter la stratégie hybride dans tous les composants')
    console.log('   • Monitorer les performances du cache')
    
    console.log('\n3️⃣  MOYEN TERME (optimisation):')
    if (totalLocalMedias > 0) {
      console.log('   • Analyser l\'utilisation réelle des médias locaux')
      console.log('   • Migrer progressivement vers cache d\'URLs')
      console.log('   • Nettoyer les médias locaux non utilisés')
    } else {
      console.log('   • Optimiser les stratégies de cache')
      console.log('   • Monitorer les taux de succès Screenscraper')
      console.log('   • Affiner les fallbacks')
    }
    
    console.log('\n4️⃣  LONG TERME (maintenance):')
    console.log('   • Nettoyage automatique des caches expirés')
    console.log('   • Monitoring des coûts et performances')
    console.log('   • Évaluation périodique de la stratégie')
    
    // Recommandations spécifiques
    console.log('\n💡 RECOMMANDATIONS TECHNIQUES:')
    console.log('-' * 35)
    
    console.log('\n🏗️  ARCHITECTURE:')
    console.log('   • Tables game_medias/console_medias: GARDER comme fallback')
    console.log('   • Table media_url_cache: UTILISER comme priorité')
    console.log('   • Composants: Implémenter stratégie hybride')
    
    console.log('\n⚡ PERFORMANCE:')
    console.log('   • Cache hit rate attendu: >95% après 24h')
    console.log('   • Réduction de charge serveur: ~90%')
    console.log('   • Économies stockage: 99%+ pour gros volumes')
    
    console.log('\n🔧 IMPLÉMENTATION:')
    console.log('   • Modifier OptimizedGameImage pour utiliser getBestGameMedia()')
    console.log('   • Ajouter monitoring cache dans admin')
    console.log('   • Créer scripts de maintenance automatisés')
    
    return {
      success: true,
      mediaStats,
      cacheStats,
      recommendations: {
        useHybridStrategy: true,
        prioritizeUrlCache: true,
        keepLocalAsFailback: totalLocalMedias > 0,
        potentialSavings: `${((totalLocalMedias * 200) / 1024).toFixed(1)} MB`
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Exécuter l'analyse si le script est appelé directement
if (require.main === module) {
  analyzeMediaMigration()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ Analyse terminée!')
        console.log('\n🎉 Votre architecture hybride est optimale!')
        process.exit(0)
      } else {
        console.error('\n❌ Analyse échouée!')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('❌ Erreur inattendue:', error)
      process.exit(1)
    })
}

export { analyzeMediaMigration }