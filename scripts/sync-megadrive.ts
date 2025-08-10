#!/usr/bin/env tsx

import { getScreenscraperService } from '../lib/screenscraper-client'

async function syncMegadrive() {
  try {
    console.log('🎮 Synchronisation de la Megadrive (ID: 1)...')
    
    const service = getScreenscraperService()
    const result = await service.syncSingleConsole(1) // Megadrive = system ID 1
    
    console.log(`✅ Console synchronisée: ${result.name}`)
    console.log(`📁 Médias téléchargés: ${result.mediaCount}`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error)
  }
}

syncMegadrive()