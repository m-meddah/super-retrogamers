'use client'

import { useRegionalPreferences } from '@/lib/hooks/use-regional-preferences'

export default function RegionInitializer() {
  // Initialise le système de région simple sans persistance DB
  useRegionalPreferences()
  
  return null
}