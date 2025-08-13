'use client'

import { useQueryState } from 'nuqs'
import { Region } from '@prisma/client'
import { useCallback } from 'react'

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