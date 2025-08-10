/**
 * Script pour générer les variants de consoles pour toutes les consoles existantes
 * Usage: npx tsx scripts/generate-console-variants.ts
 */

import { createVariantsForAllConsoles } from '../lib/console-variants-service'

async function generateAllConsoleVariants() {
  try {
    console.log('🚀 Génération des variants de consoles...')
    
    const result = await createVariantsForAllConsoles()
    
    if (result.success) {
      console.log('✅ Génération terminée avec succès!')
      console.log(`📈 ${result.totalCreated} variants créés au total`)
      console.log('')
      console.log('📊 Détails par console:')
      
      result.results.forEach(consoleResult => {
        if (consoleResult.created > 0) {
          console.log(`   ✅ ${consoleResult.console}: ${consoleResult.created} variants`)
        } else if (consoleResult.error) {
          console.log(`   ❌ ${consoleResult.console}: ${consoleResult.error}`)
        } else {
          console.log(`   ⏭️  ${consoleResult.console}: Aucun variant à créer`)
        }
      })
    } else {
      console.log('❌ Erreur lors de la génération des variants')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération des variants:', error)
    process.exit(1)
  }
}

console.log('📋 Génération des variants de consoles par région')
console.log('   - Régions supportées: FR, EU, WOR, JP, US')
console.log('   - Auto-mapping basé sur les consoles existantes')
console.log('')

generateAllConsoleVariants()