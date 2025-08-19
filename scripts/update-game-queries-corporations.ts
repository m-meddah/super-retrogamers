#!/usr/bin/env tsx

import fs from 'fs/promises'
import path from 'path'

async function updateGameQueries() {
  console.log('🔄 Mise à jour des requêtes de jeux pour inclure les relations Corporation...\n')

  try {
    const filePath = path.join(process.cwd(), 'lib', 'data-prisma.ts')
    let content = await fs.readFile(filePath, 'utf-8')
    
    // Patterns à remplacer pour ajouter corporationDev et corporationPub
    const updates = [
      // Pattern 1: include avec genres et regionalDates mais pas de corporation
      {
        from: /(\s+genres: {\s+orderBy: { isPrimary: 'desc' }\s+},\s+regionalDates: {\s+orderBy: { region: 'asc' }\s+})\s+}/g,
        to: '$1,\n      corporationDev: true,\n      corporationPub: true\n    }'
      },
      // Pattern 2: include avec genre et medias mais pas de corporation (sans genres et regionalDates)
      {
        from: /(\s+genre: true, \/\/ Inclure le genre principal\s+medias: {\s+orderBy: \[\s+{ mediaType: 'asc' },\s+{ region: 'asc' }\s+\]\s+})\s+}/g,
        to: '$1,\n      corporationDev: true,\n      corporationPub: true\n    }'
      },
      // Pattern 3: include avec console et medias seulement
      {
        from: /(\s+console: true,\s+medias: {\s+orderBy: \[\s+{ mediaType: 'asc' },\s+{ region: 'asc' }\s+\]\s+})\s+}\s+},\s+orderBy:/g,
        to: '$1,\n      corporationDev: true,\n      corporationPub: true\n    }\n  },\n  orderBy:'
      }
    ]

    let changesMade = 0
    
    for (const update of updates) {
      const matches = content.match(update.from)
      if (matches) {
        content = content.replace(update.from, update.to)
        changesMade += matches.length
        console.log(`✅ Pattern ${updates.indexOf(update) + 1}: ${matches.length} remplacements`)
      }
    }

    // Écrire le fichier mis à jour
    await fs.writeFile(filePath, content, 'utf-8')
    
    console.log(`\n🎯 Mise à jour terminée: ${changesMade} modifications apportées`)
    
    return {
      success: true,
      changesMade
    }

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Exécuter la mise à jour si le script est appelé directement
if (require.main === module) {
  updateGameQueries()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ Mise à jour terminée!')
        process.exit(0)
      } else {
        console.error('\n❌ Mise à jour échouée!')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('❌ Erreur inattendue:', error)
      process.exit(1)
    })
}

export { updateGameQueries }