#!/usr/bin/env tsx

/**
 * Test direct de l'API mediaCompagnie.php de Screenscraper
 */

import { testCorporationLogo } from '@/lib/screenscraper-corporations'

async function main() {
  const testId = process.argv[2] ? parseInt(process.argv[2]) : 83
  
  console.log('🧪 TEST DIRECT DE L\'API SCREENSCRAPER CORPORATION')
  console.log(`⏰ Démarré à: ${new Date().toLocaleString('fr-FR')}`)
  console.log(`🎯 Test avec l'ID corporation: ${testId}`)
  
  // Test avec quelques IDs connus
  const testIds = [testId, 1, 83, 2, 6] // Sony, Nintendo, Sega, etc.
  
  for (const id of testIds) {
    console.log(`\n--- Test ID ${id} ---`)
    const result = await testCorporationLogo(id)
    
    if (result.success) {
      console.log(`✅ Logo trouvé: ${result.logoUrl}`)
    } else {
      console.log(`❌ Pas de logo: ${result.error}`)
    }
    
    // Pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 1500))
  }
  
  console.log('\n✅ Tests terminés')
}

if (require.main === module) {
  main().catch(console.error)
}