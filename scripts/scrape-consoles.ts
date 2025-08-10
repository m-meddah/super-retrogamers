/**
 * Script pour scraper les consoles depuis Screenscraper.fr
 * Usage: npx tsx scripts/scrape-consoles.ts [limit]
 */

import { scrapeConsolesFromScreenscraper } from '../lib/screenscraper-service'

async function runConsoleScraping(limit?: number) {
  try {
    console.log('🚀 Début du scraping des consoles...')
    
    if (limit) {
      console.log(`📊 Limitation à ${limit} consoles`)
    } else {
      console.log('📊 Scraping de toutes les consoles disponibles')
    }
    
    const result = await scrapeConsolesFromScreenscraper(limit)
    
    if (result.success) {
      console.log('✅ Scraping terminé avec succès!')
      console.log(`📈 ${result.consolesAdded} consoles ajoutées`)
      console.log(`📝 ${result.message}`)
    } else {
      console.log('❌ Erreur lors du scraping:')
      console.log(`💥 ${result.message}`)
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du scraping:', error)
    process.exit(1)
  }
}

// Vérification des arguments
const args = process.argv.slice(2)
const limitArg = args[0]

let limit: number | undefined
if (limitArg) {
  const parsedLimit = parseInt(limitArg, 10)
  if (isNaN(parsedLimit) || parsedLimit < 1) {
    console.log('❌ La limite doit être un nombre positif')
    console.log('Usage: npx tsx scripts/scrape-consoles.ts [limit]')
    console.log('Exemples:')
    console.log('  npx tsx scripts/scrape-consoles.ts     # Scraper toutes les consoles')
    console.log('  npx tsx scripts/scrape-consoles.ts 10  # Scraper 10 consoles max')
    process.exit(1)
  }
  limit = parsedLimit
}

console.log('📋 Configuration:')
console.log(`   - Limite: ${limit || 'Aucune'}`)
console.log(`   - Throttling: 1.2s entre les requêtes`)
console.log('')

runConsoleScraping(limit)