#!/usr/bin/env npx tsx

/**
 * Script pour synchroniser les médias existants avec la base de données
 * Usage: npx tsx scripts/sync-existing-medias.ts
 */

import { syncExistingMediasToDatabase } from '../lib/media-detection'

async function main() {
  console.log('🚀 Démarrage de la synchronisation des médias existants...')
  
  try {
    await syncExistingMediasToDatabase()
    console.log('✅ Synchronisation terminée avec succès')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error)
    process.exit(1)
  }
}

main()