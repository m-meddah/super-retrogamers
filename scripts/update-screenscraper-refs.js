#!/usr/bin/env node

/**
 * Script pour mettre à jour toutes les références aux colonnes screenscrapeId 
 * avec les nouveaux noms normalisés spécifiques à chaque type d'entité
 */

const fs = require('fs')
const path = require('path')

// Mapping des anciens vers nouveaux noms selon le contexte
const replacements = [
  // Console contexts
  {
    pattern: /\.screenscrapeId(?=\s*[:\s,}\)\]])/g,
    replacement: '.ssConsoleId',
    contexts: ['console', 'Console']
  },
  
  // Game contexts  
  {
    pattern: /\.screenscrapeId(?=\s*[:\s,}\)\]])/g,
    replacement: '.ssGameId',
    contexts: ['game', 'Game']
  },
  
  // Genre contexts
  {
    pattern: /\.screenscrapeId(?=\s*[:\s,}\)\]])/g,
    replacement: '.ssGenreId', 
    contexts: ['genre', 'Genre']
  },
  
  // Corporation contexts
  {
    pattern: /\.screenscrapeId(?=\s*[:\s,}\)\]])/g,
    replacement: '.ssCorporationId',
    contexts: ['corporation', 'Corporation']
  },
  
  // Family contexts
  {
    pattern: /\.screenscrapeId(?=\s*[:\s,}\)\]])/g,
    replacement: '.ssFamilyId',
    contexts: ['family', 'Family']
  }
]

// Fichiers à traiter
const filesToProcess = [
  'lib/screenscraper-genres.ts',
  'lib/data-prisma.ts', 
  'lib/screenscraper-games.ts',
  'app/corporations/page.tsx',
  'app/familles/[id]/page.tsx',
  'app/admin/content/families/page.tsx',
  'app/admin/content/corporations/page.tsx',
  'app/admin/scraping/page.tsx',
  'lib/screenscraper-service.ts',
  'app/corporations/[id]/page.tsx',
  'app/admin/content/genres/page.tsx',
  'app/familles/page.tsx',
  'lib/favicon-utils.ts',
  'scripts/check-regional-data.js',
  'lib/actions/scraping-actions.ts'
]

function updateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`)
    return false
  }
  
  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false
  
  // Simple replacement approach: replace screenscrapeId with appropriate context
  if (content.includes('screenscrapeId')) {
    // Detect context and replace accordingly
    if (content.includes('genre') || content.includes('Genre')) {
      content = content.replace(/\.screenscrapeId/g, '.ssGenreId')
      modified = true
    } else if (content.includes('console') || content.includes('Console')) {
      content = content.replace(/\.screenscrapeId/g, '.ssConsoleId')
      modified = true
    } else if (content.includes('game') || content.includes('Game')) {
      content = content.replace(/\.screenscrapeId/g, '.ssGameId')
      modified = true
    } else if (content.includes('corporation') || content.includes('Corporation')) {
      content = content.replace(/\.screenscrapeId/g, '.ssCorporationId')
      modified = true
    } else if (content.includes('family') || content.includes('Family')) {
      content = content.replace(/\.screenscrapeId/g, '.ssFamilyId')
      modified = true
    }
    
    // Also replace in object property declarations
    content = content.replace(/screenscrapeId:/g, 'ssConsoleId:')
    
    if (modified) {
      fs.writeFileSync(filePath, content)
      console.log(`✓ Updated: ${filePath}`)
      return true
    }
  }
  
  return false
}

console.log('🔄 Updating screenscrapeId references...')

let totalUpdated = 0
filesToProcess.forEach(file => {
  const fullPath = path.join(__dirname, '..', file)
  if (updateFile(fullPath)) {
    totalUpdated++
  }
})

console.log(`\n✅ Updated ${totalUpdated} files`)
console.log('🏁 Done! Please review changes and run TypeScript checks.')