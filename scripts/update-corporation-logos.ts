#!/usr/bin/env tsx

/**
 * Script pour mettre à jour les logos des corporations via l'API Screenscraper
 * Utilise l'endpoint mediaCompagnie.php pour récupérer les logos wheel
 */

import { PrismaClient } from '@prisma/client'
import { 
  updateAllCorporationLogos,
  getCorporationsWithoutLogo,
  testCorporationLogo 
} from '@/lib/screenscraper-corporations'

const prisma = new PrismaClient()

async function showCorporationsStatus() {
  console.log('🔍 === ÉTAT DES LOGOS DES CORPORATIONS ===')

  const [total, withLogo, withoutLogo, withScreenscraperId] = await Promise.all([
    prisma.corporation.count(),
    prisma.corporation.count({ where: { logoUrl: { not: null } } }),
    prisma.corporation.count({ 
      where: { 
        OR: [
          { logoUrl: null },
          { logoUrl: '' }
        ]
      }
    }),
    prisma.corporation.count({ where: { ssCorporationId: { not: null } } })
  ])

  console.log(`📊 STATISTIQUES:`)
  console.log(`   Total corporations: ${total}`)
  console.log(`   Avec logo: ${withLogo}`)
  console.log(`   Sans logo: ${withoutLogo}`)
  console.log(`   Avec ID Screenscraper: ${withScreenscraperId}`)

  // Afficher les corporations sans logo qui ont un ID Screenscraper
  const corporationsToUpdate = await getCorporationsWithoutLogo()
  
  if (corporationsToUpdate.length > 0) {
    console.log(`\n🎯 CORPORATIONS À METTRE À JOUR (${corporationsToUpdate.length}):`)
    corporationsToUpdate.forEach((corp, index) => {
      console.log(`   ${index + 1}. ${corp.name} (ID: ${corp.ssCorporationId}, ${corp._count.developedGames + corp._count.publishedGames} jeux)`)
    })
  } else {
    console.log(`\n✅ Toutes les corporations avec ID Screenscraper ont déjà un logo`)
  }

  return {
    total,
    withLogo,
    withoutLogo,
    withScreenscraperId,
    corporationsToUpdate: corporationsToUpdate.length
  }
}

async function testSpecificCorporation(ssCorporationId: number) {
  console.log(`\n🧪 === TEST SUR CORPORATION SPÉCIFIQUE ===`)
  
  // Vérifier si la corporation existe
  const corporation = await prisma.corporation.findUnique({
    where: { ssCorporationId }
  })

  if (!corporation) {
    console.log(`❌ Aucune corporation trouvée avec l'ID Screenscraper ${ssCorporationId}`)
    return
  }

  console.log(`🏢 Corporation trouvée: ${corporation.name}`)
  console.log(`   Logo actuel: ${corporation.logoUrl || 'Aucun'}`)

  // Tester la récupération du logo
  const result = await testCorporationLogo(ssCorporationId)
  
  return result
}

async function updateLogos() {
  console.log(`\n🚀 === MISE À JOUR DES LOGOS ===`)
  
  const result = await updateAllCorporationLogos()

  if (result.success) {
    console.log(`\n✅ MISE À JOUR TERMINÉE`)
    
    // Afficher les détails
    if (result.details.length > 0) {
      console.log(`\n📋 DÉTAILS PAR CORPORATION:`)
      result.details.forEach((detail, index) => {
        const status = detail.success ? '✅' : '❌'
        const error = detail.error ? ` (${detail.error})` : ''
        console.log(`   ${index + 1}. ${status} ${detail.name}${error}`)
      })
    }

    // Statistiques finales
    await showCorporationsStatus()
    
  } else {
    console.log(`\n❌ ÉCHEC DE LA MISE À JOUR`)
    console.log(`   Erreur: ${result.details[0]?.error}`)
  }

  return result
}

async function main() {
  const args = process.argv.slice(2)
  
  console.log('🏢 GESTIONNAIRE DE LOGOS DES CORPORATIONS')
  console.log(`⏰ Démarré à: ${new Date().toLocaleString('fr-FR')}`)

  try {
    if (args.length === 0) {
      // Mode par défaut: afficher l'état puis mettre à jour
      console.log('\n📋 Mode par défaut: état + mise à jour')
      
      const status = await showCorporationsStatus()
      
      if (status.corporationsToUpdate === 0) {
        console.log('\n🎉 Aucune mise à jour nécessaire!')
        return
      }
      
      console.log(`\n❓ Continuer avec la mise à jour de ${status.corporationsToUpdate} corporations? (Ctrl+C pour annuler)`)
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      await updateLogos()
      
    } else if (args[0] === 'status') {
      // Afficher uniquement l'état
      await showCorporationsStatus()
      
    } else if (args[0] === 'update') {
      // Forcer la mise à jour
      await updateLogos()
      
    } else if (args[0] === 'test' && args[1]) {
      // Tester une corporation spécifique
      const ssCorporationId = parseInt(args[1])
      if (isNaN(ssCorporationId)) {
        console.error('❌ L\'ID de la corporation doit être un nombre')
        process.exit(1)
      }
      await testSpecificCorporation(ssCorporationId)
      
    } else {
      console.log(`\n📖 USAGE:`)
      console.log(`   npx tsx scripts/update-corporation-logos.ts           # Statut + mise à jour`)
      console.log(`   npx tsx scripts/update-corporation-logos.ts status   # Afficher le statut uniquement`)
      console.log(`   npx tsx scripts/update-corporation-logos.ts update   # Forcer la mise à jour`)
      console.log(`   npx tsx scripts/update-corporation-logos.ts test 83  # Tester une corporation spécifique`)
      console.log(`\n💡 EXEMPLES:`)
      console.log(`   npx tsx scripts/update-corporation-logos.ts test 83    # Tester Nintendo`)
      console.log(`   npx tsx scripts/update-corporation-logos.ts test 1     # Tester Sony`)
      console.log(`   npx tsx scripts/update-corporation-logos.ts update     # Mettre à jour tous les logos`)
    }

  } catch (error) {
    console.error('\n💥 ERREUR FATALE:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Gestion des signaux pour arrêt propre
process.on('SIGINT', async () => {
  console.log('\n⏹️ Arrêt demandé, nettoyage...')
  await prisma.$disconnect()
  process.exit(0)
})

// Exécution du script
if (require.main === module) {
  main()
}

export { main as updateCorporationLogos }