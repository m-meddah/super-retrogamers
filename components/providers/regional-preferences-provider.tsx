'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useQueryState } from 'nuqs'

interface RegionalPreferencesContextType {
  preferredRegion: string
  setPreferredRegion: (region: string) => void
}

const RegionalPreferencesContext = createContext<RegionalPreferencesContextType | undefined>(undefined)

export function RegionalPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferredRegion, setPreferredRegion] = useQueryState('region', {
    defaultValue: 'fr',
    parse: (value) => value || 'fr',
    serialize: (value) => value})

  return (
    <RegionalPreferencesContext.Provider value={{ preferredRegion, setPreferredRegion }}>
      {children}
    </RegionalPreferencesContext.Provider>
  )
}

export function useRegionalPreferences() {
  const context = useContext(RegionalPreferencesContext)
  if (context === undefined) {
    throw new Error('useRegionalPreferences must be used within a RegionalPreferencesProvider')
  }
  return context
}