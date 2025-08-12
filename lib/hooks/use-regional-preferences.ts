'use client'

import { useQueryState } from 'nuqs'
import { Region } from '@prisma/client'
import { useCallback } from 'react'

// Schéma de validation pour les régions
const regionSchema = {
  parse: (value: string): Region => {
    const validRegions: Region[] = ['FR', 'EU', 'WOR', 'JP', 'US']
    return validRegions.includes(value as Region) ? (value as Region) : 'FR'
  },
  serialize: (value: Region): string => value,
}

export function useRegionalPreferences() {
  const [region, setRegion] = useQueryState('region', {
    defaultValue: 'FR' as Region,
    ...regionSchema,
    shallow: false, // Persiste dans l'historique
    throttleMs: 300, // Évite les appels trop fréquents
    clearOnDefault: false // Garde la valeur par défaut dans l'URL
  })

  const changeRegion = useCallback((newRegion: Region) => {
    setRegion(newRegion)
  }, [setRegion])

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
  })
  
  return region
}