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

async function cleanMediaReferences() {
  console.log('🧹 Nettoyage des références aux médias locaux...\n')

  try {
    // Trouver tous les fichiers TypeScript et TSX
    const files = await glob('**/*.{ts,tsx}', {
      ignore: IGNORED_PATHS,
      cwd: process.cwd()
    })

    console.log(`📁 ${files.length} fichiers à analyser`)

    let totalChanges = 0

    for (const file of files) {
      let content = await fs.readFile(file, 'utf-8')
      let changes = 0
      const originalContent = content

      // Remplacements pour nettoyer les médias
      const cleanupPatterns = [
        // Supprimer les includes de médias
        { 
          from: /,?\s*medias:\s*{\s*[^}]*\s*}/gs, 
          to: '' 
        },
        { 
          from: /,?\s*medias:\s*true/g, 
          to: '' 
        },
        // Supprimer les imports de types médias
        { 
          from: /,\s*ConsoleMedia/g, 
          to: '' 
        },
        { 
          from: /,\s*GameMedia/g, 
          to: '' 
        },
        { 
          from: /ConsoleMedia,\s*/g, 
          to: '' 
        },
        { 
          from: /GameMedia,\s*/g, 
          to: '' 
        },
        // Supprimer les références aux médias dans les types
        { 
          from: /medias\?\:\s*GameMedia\[\]/g, 
          to: '' 
        },
        { 
          from: /medias\:\s*ConsoleMedia\[\]/g, 
          to: '' 
        },
        // Nettoyer les virgules en trop
        { 
          from: /,\s*,/g, 
          to: ',' 
        },
        { 
          from: /{\s*,/g, 
          to: '{' 
        },
        { 
          from: /,\s*}/g, 
          to: '}' 
        }
      ]

      for (const pattern of cleanupPatterns) {
        const matches = content.match(pattern.from)
        if (matches) {
          content = content.replace(pattern.from, pattern.to)
          changes += matches.length
        }
      }

      // Nettoyer les lignes vides en trop
      content = content.replace(/\n\s*\n\s*\n/g, '\n\n')

      if (changes > 0 && content !== originalContent) {
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
    console.error('❌ Erreur lors du nettoyage:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Exécuter le nettoyage si appelé directement
if (require.main === module) {
  cleanMediaReferences()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ Nettoyage terminé!')
        console.log('🎉 Code nettoyé avec succès!')
        process.exit(0)
      } else {
        console.error('\n❌ Nettoyage échoué!')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('❌ Erreur inattendue:', error)
      process.exit(1)
    })
}

export { cleanMediaReferences }