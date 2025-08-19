#!/usr/bin/env node

/**
 * Script pour corriger précisément les références screenscrapeId/ssXxxId
 * en fonction du contexte du fichier et de la table concernée
 */

const fs = require('fs')
const path = require('path')

// Corrections spécifiques par fichier
const fileCorrections = {
  'app/corporations/page.tsx': {
    'ssGameId': 'ssCorporationId'
  },
  'app/corporations/[id]/page.tsx': {
    'ssGameId': 'ssCorporationId'
  },
  'app/admin/content/corporations/page.tsx': {
    'ssGameId': 'ssCorporationId'
  },
  'app/familles/page.tsx': {
    'ssGameId': 'ssFamilyId'
  },
  'app/admin/content/families/page.tsx': {
    'ssGameId': 'ssFamilyId'
  },
  'lib/screenscraper-genres.ts': {
    'ssConsoleId': 'ssGenreId'
  },
  'lib/data-prisma.ts': {
    // Fix specific patterns in data-prisma.ts
    'genre.ssConsoleId': 'genre.ssGenreId',
    'ssConsoleId: genreGroup.genreId': 'ssGenreId: genreGroup.genreId',
    'genreId: genre.ssGenreId': 'genreId: genre.ssGenreId'
  },
  'lib/screenscraper-games.ts': {
    // Game context should use ssGameId
    'ssConsoleId: gameId': 'ssGameId: gameId',
    'game.ssGenreId': 'game.ssGameId',
    'gameConsole.ssGenreId': 'gameConsole.ssConsoleId'
  }
}

function fixFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`)
    return false
  }
  
  let content = fs.readFileSync(fullPath, 'utf8')
  let modified = false
  
  const corrections = fileCorrections[filePath]
  if (corrections) {
    for (const [from, to] of Object.entries(corrections)) {
      const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      const newContent = content.replace(regex, to)
      if (newContent !== content) {
        content = newContent
        modified = true
        console.log(`  ${from} → ${to}`)
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(fullPath, content)
    console.log(`✓ Fixed: ${filePath}`)
    return true
  }
  
  return false
}

console.log('🔧 Fixing screenscrapeId references with correct context...')

let totalFixed = 0
for (const filePath of Object.keys(fileCorrections)) {
  console.log(`\n📁 ${filePath}:`)
  if (fixFile(filePath)) {
    totalFixed++
  } else {
    console.log('  No changes needed')
  }
}

console.log(`\n✅ Fixed ${totalFixed} files`)
console.log('🏁 Done! Run TypeScript checks to verify.')