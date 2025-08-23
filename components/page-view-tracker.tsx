'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageViewAction } from '@/lib/actions/analytics-actions'

interface PageViewTrackerProps {
  // Pour forcer le tracking d'un chemin spécifique
  trackPath?: string
}

/**
 * Composant pour tracker les vues de page côté client
 * Utilise une Server Action pour enregistrer la vue
 */
export default function PageViewTracker({ trackPath }: PageViewTrackerProps = {}) {
  const pathname = usePathname()
  const pathToTrack = trackPath || pathname

  useEffect(() => {
    // Ne tracker que les pages importantes (jeux, consoles)
    if (pathToTrack.startsWith('/games/') || 
        pathToTrack.startsWith('/consoles/') ||
        pathToTrack === '/') {
      
      // Éviter de tracker immédiatement, attendre un peu pour s'assurer que c'est une vraie visite
      const timer = setTimeout(async () => {
        try {
          await trackPageViewAction(pathToTrack)
        } catch (error) {
          // Silencer les erreurs de tracking
          console.debug('Erreur tracking:', error)
        }
      }, 2000) // Attendre 2 secondes

      return () => clearTimeout(timer)
    }
  }, [pathToTrack])

  // Composant invisible
  return null
}