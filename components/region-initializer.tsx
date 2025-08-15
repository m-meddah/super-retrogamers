'use client'

import { usePersistentRegion } from '@/lib/hooks/use-persistent-region'

export default function RegionInitializer() {
  // Initialise le système de région persistante
  usePersistentRegion()
  
  return null
}