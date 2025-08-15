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

      // Attendre que la session soit chargée
      if (isPending) {
        return
      }
      
      // Si pas de session utilisateur, ne rien faire
      if (!session?.user) {
        setInitialized(true)
        return
      }
      
      try {
        // Vérifier si une région est déjà dans l'URL
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.has('region')) {
          setInitialized(true)
          return // Une région est déjà définie
        }

        // Sinon, charger la région préférée de l'utilisateur
        const { getUserPreferredRegionAction } = await import('@/lib/actions/settings-actions')
        const preferredRegion = await getUserPreferredRegionAction()
        
        if (preferredRegion) {
          setRegion(preferredRegion as Region)
        }
      } catch (error) {
        console.error('Error initializing user preferred region:', error)
      } finally {
        setInitialized(true)
      }
    }

    initializeRegion()
  }, [initialized, setRegion, session, isPending])
}