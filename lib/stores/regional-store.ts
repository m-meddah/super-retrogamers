'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Region } from '@prisma/client'
import { SupportedRegion, getRegionPriority } from '@/lib/regional-preferences'

interface RegionalState {
  currentRegion: Region
  preferredRegion: SupportedRegion
  regionPriority: SupportedRegion[]
  setRegion: (region: Region) => void
  initializeFromUrl: (region: Region) => void
  resetToDefault: () => void
}

// Mapping des régions Prisma vers nos types supportés
const mapToSupportedRegion = (region: Region): SupportedRegion => {
  const mapping: Record<Region, SupportedRegion> = {
    FR: 'FR',
    EU: 'EU',
    WOR: 'WOR',
    JP: 'JP',
    ASI: 'ASI',
    US: 'US'
  }
  return mapping[region] || 'FR'
}

export const useRegionalStore = create<RegionalState>()(
  subscribeWithSelector((set) => ({
    currentRegion: 'FR',
    preferredRegion: 'FR',
    regionPriority: getRegionPriority('FR'),

    setRegion: (region: Region) => {
      const supportedRegion = mapToSupportedRegion(region)
      const priority = getRegionPriority(supportedRegion)
      
      set({
        currentRegion: region,
        preferredRegion: supportedRegion,
        regionPriority: priority
      })

      // Synchroniser avec l'URL
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.set('region', region)
        window.history.pushState({}, '', url.toString())
      }
    },

    initializeFromUrl: (region: Region) => {
      const supportedRegion = mapToSupportedRegion(region)
      const priority = getRegionPriority(supportedRegion)
      
      set({
        currentRegion: region,
        preferredRegion: supportedRegion,
        regionPriority: priority
      })
    },

    resetToDefault: () => {
      set({
        currentRegion: 'FR',
        preferredRegion: 'FR',
        regionPriority: getRegionPriority('FR')
      })

      // Synchroniser avec l'URL
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.set('region', 'FR')
        window.history.pushState({}, '', url.toString())
      }
    }
  }))
)

// Hook pour les composants qui ont seulement besoin de lire
export const useCurrentRegion = () => useRegionalStore(state => state.currentRegion)
export const usePreferredRegion = () => useRegionalStore(state => state.preferredRegion)
export const useRegionPriority = () => useRegionalStore(state => state.regionPriority)