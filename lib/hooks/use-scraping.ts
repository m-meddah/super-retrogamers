'use client'

import { useScrapingStore } from '@/lib/stores/scraping-store'
import { useAppStore } from '@/lib/stores/app-store'
import {
  scrapeConsolesAction,
  scrapeGamesAction,
  scrapeFullAction,
  getScrapingStatusAction
} from '@/lib/actions/scraping-actions'

export function useScraping() {
  const {
    status,
    lastResult,
    history,
    startScraping,
    stopScraping,
    addLog,
    clearLogs,
    completeScraping,
    resetScraping
  } = useScrapingStore()

  const { addNotification } = useAppStore()

  const scrapeConsoles = async (mode: 'priority' | 'all' = 'priority') => {
    startScraping('consoles')
    addLog(`Début du scraping des consoles (mode: ${mode})`)
    
    try {
      const result = await scrapeConsolesAction(mode)
      
      if (result.success && result.data) {
        addLog(`✅ Scraping terminé: ${result.data.imported}/${result.data.total} consoles importées`)
        
        completeScraping({
          success: true,
          total: result.data.total,
          imported: result.data.imported,
          errors: result.data.errorDetails || [],
          operation: `Consoles (${mode})`
        })

        addNotification({
          type: 'success',
          title: 'Scraping terminé',
          message: `${result.data.imported} consoles importées avec succès`
        })
      } else {
        addLog(`❌ Erreur: ${result.error}`)
        
        completeScraping({
          success: false,
          total: 0,
          imported: 0,
          errors: [result.error || 'Erreur inconnue'],
          operation: `Consoles (${mode})`
        })

        addNotification({
          type: 'error',
          title: 'Erreur de scraping',
          message: result.error || 'Une erreur est survenue'
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      addLog(`❌ Exception: ${errorMessage}`)
      
      completeScraping({
        success: false,
        total: 0,
        imported: 0,
        errors: [errorMessage],
        operation: `Consoles (${mode})`
      })

      addNotification({
        type: 'error',
        title: 'Erreur de scraping',
        message: errorMessage
      })
    }
  }

  const scrapeGames = async (systemId: number, maxGames = 50) => {
    startScraping('games')
    addLog(`Début du scraping des jeux pour le système ${systemId} (max: ${maxGames})`)
    
    try {
      const result = await scrapeGamesAction(systemId, maxGames)
      
      if (result.success && result.data) {
        addLog(`✅ Scraping terminé: ${result.data.imported}/${result.data.total} jeux importés`)
        
        completeScraping({
          success: true,
          total: result.data.total,
          imported: result.data.imported,
          errors: result.data.errorDetails || [],
          operation: `Jeux (Système ${systemId})`
        })

        addNotification({
          type: 'success',
          title: 'Scraping terminé',
          message: `${result.data.imported} jeux importés avec succès`
        })
      } else {
        addLog(`❌ Erreur: ${result.error}`)
        
        completeScraping({
          success: false,
          total: 0,
          imported: 0,
          errors: [result.error || 'Erreur inconnue'],
          operation: `Jeux (Système ${systemId})`
        })

        addNotification({
          type: 'error',
          title: 'Erreur de scraping',
          message: result.error || 'Une erreur est survenue'
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      addLog(`❌ Exception: ${errorMessage}`)
      
      completeScraping({
        success: false,
        total: 0,
        imported: 0,
        errors: [errorMessage],
        operation: `Jeux (Système ${systemId})`
      })

      addNotification({
        type: 'error',
        title: 'Erreur de scraping',
        message: errorMessage
      })
    }
  }

  const scrapeFull = async (maxGamesPerSystem = 25) => {
    startScraping('full')
    addLog(`Début du scraping complet (${maxGamesPerSystem} jeux max par système)`)
    
    try {
      const result = await scrapeFullAction(maxGamesPerSystem)
      
      if (result.success && result.data) {
        addLog(`✅ Scraping complet terminé: ${result.data.imported}/${result.data.total} éléments importés`)
        
        completeScraping({
          success: true,
          total: result.data.total,
          imported: result.data.imported,
          errors: result.data.errorDetails || [],
          operation: 'Scraping complet'
        })

        addNotification({
          type: 'success',
          title: 'Scraping complet terminé',
          message: `${result.data.imported} éléments importés avec succès`,
          duration: 8000
        })
      } else {
        addLog(`❌ Erreur: ${result.error}`)
        
        completeScraping({
          success: false,
          total: 0,
          imported: 0,
          errors: [result.error || 'Erreur inconnue'],
          operation: 'Scraping complet'
        })

        addNotification({
          type: 'error',
          title: 'Erreur de scraping',
          message: result.error || 'Une erreur est survenue'
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      addLog(`❌ Exception: ${errorMessage}`)
      
      completeScraping({
        success: false,
        total: 0,
        imported: 0,
        errors: [errorMessage],
        operation: 'Scraping complet'
      })

      addNotification({
        type: 'error',
        title: 'Erreur de scraping',
        message: errorMessage
      })
    }
  }

  const getStatus = async () => {
    try {
      const result = await getScrapingStatusAction()
      return result
    } catch (error) {
      console.error('Error getting scraping status:', error)
      return {
        success: false,
        error: 'Erreur lors de la récupération du statut'
      }
    }
  }

  return {
    // State
    status,
    lastResult,
    history,
    
    // Actions
    scrapeConsoles,
    scrapeGames,
    scrapeFull,
    getStatus,
    stopScraping,
    clearLogs,
    resetScraping,
    
    // Utilities
    isRunning: status.isRunning,
    progress: status.progress,
    logs: status.logs,
  }
}