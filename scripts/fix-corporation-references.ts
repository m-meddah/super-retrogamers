#!/usr/bin/env tsx

import fs from 'fs/promises'
import path from 'path'
import { glob } from 'glob'

const IGNORED_PATHS = [
  'node_modules/**',
  '.next/**',
  'dist/**',
  '**/*.d.ts',
  'scripts/**'
]

async function fixCorporationReferences() {
  console.log('🔄 Correction des références developer/publisher vers corporationDev/corporationPub...\n')

  try {
    // Trouver tous les fichiers TypeScript et TSX
    const files = await glob('**/*.{ts,tsx}', {
      ignore: IGNORED_PATHS,
      cwd: process.cwd()
    })

    console.log(`📁 ${files.length} fichiers trouvés`)

    let totalChanges = 0

    for (const file of files) {
      let content = await fs.readFile(file, 'utf-8')
      let changes = 0

      // Remplacements des références dans les composants/pages
      const replacements = [
        // game.developer → game.corporationDev?.name
        { from: /(\w+)\.developer(?!\w)/g, to: '$1.corporationDev?.name' },
        // game.publisher → game.corporationPub?.name  
        { from: /(\w+)\.publisher(?!\w)/g, to: '$1.corporationPub?.name' },
        // form field: developer → corporationDevName
        { from: /developer:\s*([^,]+\.developer)/g, to: 'developer: $1?.corporationDev?.name' },
        { from: /publisher:\s*([^,]+\.publisher)/g, to: 'publisher: $1?.corporationPub?.name' },
        // Corrections pour les actions de recherche
        { from: /developer: \{ contains:/g, to: 'corporationDev: { name: { contains:' },
        { from: /publisher: \{ contains:/g, to: 'corporationPub: { name: { contains:' },
        // Corrections pour les where clauses en SQL
        { from: /\{ developer:/g, to: '{ corporationDev: { name:' },
        { from: /\{ publisher:/g, to: '{ corporationPub: { name:' }
      ]

      for (const replacement of replacements) {
        const matches = content.match(replacement.from)
        if (matches) {
          content = content.replace(replacement.from, replacement.to)
          changes += matches.length
        }
      }

      if (changes > 0) {
        await fs.writeFile(file, content, 'utf-8')
        console.log(`✅ ${file}: ${changes} modifications`)
        totalChanges += changes
      }
    }

    console.log(`\n🎯 Total: ${totalChanges} modifications dans ${files.length} fichiers`)

    return {
      success: true,
      totalChanges,
      filesProcessed: files.length
    }

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  fixCorporationReferences()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ Correction terminée!')
        process.exit(0)
      } else {
        console.error('\n❌ Correction échouée!')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('❌ Erreur inattendue:', error)
      process.exit(1)
    })
}

export { fixCorporationReferences }