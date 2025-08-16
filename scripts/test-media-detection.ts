#!/usr/bin/env npx tsx

/**
 * Script de test pour la détection des médias existants
 * Usage: npx tsx scripts/test-media-detection.ts
 */

import { 
  scanExistingConsoleMedias, 
  scanExistingGameMedias,
  checkExistingConsoleMedia,
  checkExistingGameMedia,
  SCREENSCRAPER_MEDIA_TYPES 
} from '../lib/media-detection'

async function main() {
  console.log('🧪 Test de détection des médias existants...\n')
  
  // Test 1: Scan des médias de consoles
  console.log('📱 Test 1: Scan des médias de consoles')
  const testConsoles = ['neo-geo', 'super-nintendo', 'playstation']
  
  for (const consoleSlug of testConsoles) {
    console.log(`\n🔍 Scan de ${consoleSlug}:`)
    const medias = scanExistingConsoleMedias(consoleSlug)
    console.log(`  → ${medias.length} médias trouvés`)
    
    // Afficher un échantillon
    const sample = medias.slice(0, 3)
    for (const media of sample) {
      console.log(`    • ${media.mediaType}/${media.region}: ${media.fileName}`)
    }
    
    if (medias.length > 3) {
      console.log(`    ... et ${medias.length - 3} autres`)
    }
  }

  // Test 2: Scan des médias de jeux
  console.log('\n\n🎮 Test 2: Scan des médias de jeux')
  const testGames = [
    '1941-counter-attack-pc-engine-supergrafx',
    'aldynes-the-mission-code-for-rage-crisis-pc-engine-supergrafx'
  ]
  
  for (const gameSlug of testGames) {
    console.log(`\n🔍 Scan de ${gameSlug}:`)
    const medias = scanExistingGameMedias(gameSlug)
    console.log(`  → ${medias.length} médias trouvés`)
    
    // Afficher un échantillon
    const sample = medias.slice(0, 3)
    for (const media of sample) {
      console.log(`    • ${media.mediaType}/${media.region}: ${media.fileName}`)
    }
    
    if (medias.length > 3) {
      console.log(`    ... et ${medias.length - 3} autres`)
    }
  }

  // Test 3: Test de vérification de médias spécifiques
  console.log('\n\n🎯 Test 3: Vérification de médias spécifiques')
  
  // Test pour une console
  const neoGeoMinicon = checkExistingConsoleMedia('neo-geo', 'minicon', 'unknown')
  console.log(`Neo Geo minicon: ${neoGeoMinicon ? '✅ Trouvé' : '❌ Non trouvé'}`)
  if (neoGeoMinicon) {
    console.log(`  → ${neoGeoMinicon}`)
  }

  const neoGeoWheel = checkExistingConsoleMedia('neo-geo', 'wheel', 'unknown')
  console.log(`Neo Geo wheel: ${neoGeoWheel ? '✅ Trouvé' : '❌ Non trouvé'}`)
  if (neoGeoWheel) {
    console.log(`  → ${neoGeoWheel}`)
  }

  // Test 4: Statistiques globales
  console.log('\n\n📊 Test 4: Statistiques globales')
  
  let totalConsoleMedias = 0
  let totalGameMedias = 0
  
  // Compter tous les médias de consoles
  const { readdirSync, existsSync } = await import('fs')
  const { join } = await import('path')
  
  const consolesPath = join(process.cwd(), 'public', 'consoles')
  if (existsSync(consolesPath)) {
    const consoleFolders = readdirSync(consolesPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
    
    for (const consoleSlug of consoleFolders) {
      const medias = scanExistingConsoleMedias(consoleSlug)
      totalConsoleMedias += medias.length
    }
  }

  // Compter tous les médias de jeux
  const gamesPath = join(process.cwd(), 'public', 'games')
  if (existsSync(gamesPath)) {
    const gameFolders = readdirSync(gamesPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
    
    for (const gameSlug of gameFolders) {
      const medias = scanExistingGameMedias(gameSlug)
      totalGameMedias += medias.length
    }
  }

  console.log(`📱 Total médias consoles: ${totalConsoleMedias}`)
  console.log(`🎮 Total médias jeux: ${totalGameMedias}`)
  console.log(`🎯 Total général: ${totalConsoleMedias + totalGameMedias}`)

  // Test 5: Types de médias supportés
  console.log('\n\n🏷️  Test 5: Types de médias supportés')
  console.log(`${SCREENSCRAPER_MEDIA_TYPES.length} types de médias reconnus:`)
  for (const mediaType of SCREENSCRAPER_MEDIA_TYPES) {
    console.log(`  • ${mediaType}`)
  }

  console.log('\n✅ Tests de détection terminés')
}

main().catch(console.error)