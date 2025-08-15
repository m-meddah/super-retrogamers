'use client'

import { useQueryState } from 'nuqs'
import { Region } from '@prisma/client'
import { useCallback, useState, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'

// Schéma de validation pour les régions (incluant ASI)
const regionSchema = {
  parse: (value: string): Region => {
    const validRegions: Region[] = ['FR', 'EU', 'WOR', 'JP', 'ASI', 'US']
    return validRegions.includes(value as Region) ? (value as Region) : 'FR'
  },
  serialize: (value: Region): string => value,
}

export function useRegionalPreferences() {
  const [region, setRegion] = useQueryState('region', {
    defaultValue: 'FR' as Region,
    ...regionSchema,
    shallow: false, // Persiste dans l'historique
    throttleMs: 50, // Réactivité maximale
    clearOnDefault: false, // Garde la valeur par défaut dans l'URL
    history: 'push' // Force la persistance dans l'historique
  })

  const changeRegion = useCallback((newRegion: Region) => {
    console.log(`Changing region from ${region} to ${newRegion}`)
    setRegion(newRegion)
  }, [region, setRegion])

  // Fonction pour réinitialiser à la région par défaut
  const resetRegion = useCallback(() => {
    setRegion('FR')
  }, [setRegion])

  return {
    region,
    setRegion: changeRegion,
    resetRegion,
    isDefaultRegion: region === 'FR'
  }
}

// Hook simplifié pour les composants qui ont seulement besoin de lire la région
export function useCurrentRegion(): Region {
  const [region] = useQueryState('region', {
    defaultValue: 'FR' as Region,
    ...regionSchema,
    shallow: false // Important pour la réactivité
  })
  
  return region
}

// Hook pour obtenir la région effective : maintenant juste un alias
export function useEffectiveRegion(): Region {
  return useCurrentRegion()
}

// Hook pour initialiser la région préférée de l'utilisateur
export function useInitUserPreferredRegion() {
  const { setRegion } = useRegionalPreferences()
  const { data: session, isPending } = useSession()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    async function initializeRegion() {
      if (initialized) return

      console.log('=== INIT USER PREFERRED REGION ===')
      console.log('Session available:', !!session)
      console.log('Is pending:', isPending)
      
      // Attendre que la session soit chargée
      if (isPending) {
        console.log('Session still loading, waiting...')
        return
      }
      
      // Si pas de session utilisateur, ne rien faire
      if (!session?.user) {
        console.log('No user session, skipping initialization')
        setInitialized(true)
        return
      }
      
      try {
        // Vérifier si une région est déjà dans l'URL
        const urlParams = new URLSearchParams(window.location.search)
        console.log('URL params:', urlParams.toString())
        if (urlParams.has('region')) {
          console.log('Region already in URL:', urlParams.get('region'))
          setInitialized(true)
          return // Une région est déjà définie
        }

        // Sinon, charger la région préférée de l'utilisateur
        console.log('Loading user preferred region for user:', session.user.id)
        const { getUserPreferredRegionAction } = await import('@/lib/actions/settings-actions')
        const preferredRegion = await getUserPreferredRegionAction()
        console.log('User preferred region from server:', preferredRegion)
        
        if (preferredRegion) {
          console.log('Setting region to user preferred:', preferredRegion)
          setRegion(preferredRegion as Region)
        } else {
          console.log('No preferred region found, using default FR')
        }
      } catch (error) {
        console.error('Error initializing user preferred region:', error)
      } finally {
        setInitialized(true)
        console.log('Initialization completed')
      }
    }

    initializeRegion()
  }, [initialized, setRegion, session, isPending])
}