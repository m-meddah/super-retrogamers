'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRegionalStore } from '@/lib/stores/regional-store'
import { Region } from '@prisma/client'

// Hook pour synchroniser le store avec l'URL au chargement
export function useRegionalSync() {
  const searchParams = useSearchParams()
  const { initializeFromUrl, setRegion } = useRegionalStore()

  useEffect(() => {
    const regionParam = searchParams.get('region')
    const validRegions: Region[] = ['FR', 'EU', 'WOR', 'JP', 'ASI', 'US']
    
    if (regionParam && validRegions.includes(regionParam as Region)) {
      initializeFromUrl(regionParam as Region)
    } else {
      // Si pas de paramètre ou invalide, définir FR par défaut
      initializeFromUrl('FR')
    }
  }, [searchParams, initializeFromUrl])

  // Fonction pour changer de région avec synchronisation URL
  const changeRegion = (newRegion: Region) => {
    setRegion(newRegion)
  }

  return { changeRegion }
}