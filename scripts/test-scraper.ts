/**
 * Script de test pour le système de scraping Screenscraper
 * 
 * Usage:
 * npm run dev (dans un terminal)
 * Puis dans un autre terminal:
 * curl -X POST http://localhost:3000/api/scrape/status
 */

import { getScreenscraperScraper } from '../lib/scraper'

async function testScraper() {
  console.log('🧪 Test du système de scraping Screenscraper...')
  
  try {
    const scraper = getScreenscraperScraper()
    
    // Test 1: Vérifier la connexion API
    console.log('📡 Test de connexion à l\'API Screenscraper...')
    
    // Test 2: Scraper une console de test (Game Boy - ID 9)
    console.log('🎮 Test d\'import d\'une console (Game Boy)...')
    const result = await scraper.scrapeGamesForSystem(9, 3) // Seulement 3 jeux pour le test
    
    console.log('✅ Résultats du test:')
    console.log(`   Jeux trouvés: ${result.total}`)
    console.log(`   Jeux importés: ${result.imported}`)
    console.log(`   Erreurs: ${result.errors.length}`)
    
    if (result.errors.length > 0) {
      console.log('❌ Erreurs détaillées:')
      result.errors.forEach(error => console.log(`   - ${error}`))
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exporter pour utilisation dans d'autres scripts
export { testScraper }

// Si le script est exécuté directement
if (require.main === module) {
  testScraper()
}