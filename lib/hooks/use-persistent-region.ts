'use client'

import { useQueryState } from 'nuqs'
import { Region } from '@prisma/client'
import { useCallback, useState, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { usePathname } from 'next/navigation'

// Schéma de validation pour les régions
const regionSchema = {
  parse: (value: string): Region => {
    const validRegions: Region[] = ['FR', 'EU', 'WOR', 'JP', 'ASI', 'US']
    return validRegions.includes(value as Region) ? (value as Region) : 'FR'
  },
  serialize: (value: Region): string => value}

// Helper functions pour gérer les cookies manuellement
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

const setCookieValue = (name: string, value: string, days: number = 365) => {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`
}

export function usePersistentRegion() {
  const { data: session, isPending } = useSession()
  const pathname = usePathname()
  const [initialized, setInitialized] = useState(false)
  
  // Reset initialization when pathname changes (navigation)
  useEffect(() => {
    console.log('Pathname changed to:', pathname, '- resetting initialization')
    setInitialized(false)
  }, [pathname])
  
  // URL state pour la région actuelle
  const [urlRegion, setUrlRegion] = useQueryState('region', {
    defaultValue: 'FR' as Region,
    ...regionSchema,
    shallow: false,
    throttleMs: 50,
    clearOnDefault: false,
    history: 'push'
  })

  // Fonction pour changer la région avec persistance
  const setRegion = useCallback((newRegion: Region) => {
    console.log(`Setting persistent region: ${newRegion}`)
    
    // Mettre à jour l'URL
    setUrlRegion(newRegion)
    
    // Persister dans les cookies
    setCookieValue('preferredRegion', newRegion)
  }, [setUrlRegion])

  // Initialisation de la région depuis la session ou les cookies
  useEffect(() => {
    async function initializeRegion() {
      console.log('=== INIT START ===', { initialized, isPending })
      
      if (initialized) {
        console.log('Already initialized, skipping')
        return
      }

      const cookieRegion = getCookie('preferredRegion')
      const urlParams = new URLSearchParams(window.location.search)
      const hasUrlRegion = urlParams.has('region')
      
      console.log('=== PERSISTENT REGION INIT ===')
      console.log('Session pending:', isPending)
      console.log('Session user:', session?.user?.id)
      console.log('Cookie region:', cookieRegion)
      console.log('URL region:', urlRegion)
      console.log('URL has region param:', hasUrlRegion)
      console.log('Current URL:', window.location.href)

      // Si l'URL a déjà une région, sauvegarder dans les cookies et terminer
      if (hasUrlRegion) {
        const urlRegionValue = urlParams.get('region')
        console.log('URL has region, saving to cookie:', urlRegionValue)
        if (urlRegionValue) {
          setCookieValue('preferredRegion', urlRegionValue)
        }
        setInitialized(true)
        return
      }

      // Attendre que la session soit chargée
      if (isPending) {
        console.log('Session still pending, waiting...')
        return
      }

      try {
        let regionToSet: Region | null = null

        // 1. Essayer de charger depuis la session utilisateur
        if (session?.user) {
          console.log('Loading from database for user:', session.user.id)
          const { getUserPreferredRegionAction } = await import('@/lib/actions/settings-actions')
          const userPreferredRegion = await getUserPreferredRegionAction()
          console.log('DB returned:', userPreferredRegion)
          
          if (userPreferredRegion && userPreferredRegion !== 'FR') {
            regionToSet = userPreferredRegion as Region
            console.log('Will use DB region:', regionToSet)
          }
        }

        // 2. Sinon essayer les cookies
        if (!regionToSet && cookieRegion && cookieRegion !== 'FR') {
          regionToSet = regionSchema.parse(cookieRegion)
          console.log('Will use cookie region:', regionToSet)
        }

        // 3. Appliquer la région
        if (regionToSet && regionToSet !== urlRegion) {
          console.log('APPLYING REGION:', regionToSet, 'current:', urlRegion)
          setRegion(regionToSet)
        } else {
          console.log('NO REGION TO APPLY - regionToSet:', regionToSet, 'urlRegion:', urlRegion)
        }

      } catch (error) {
        console.error('Error in region initialization:', error)
      } finally {
        setInitialized(true)
        console.log('=== INIT COMPLETED ===')
      }
    }

    initializeRegion()
  }, [initialized, isPending, session, urlRegion, setRegion])

  return {
    region: urlRegion,
    setRegion,
    isDefaultRegion: urlRegion === 'FR',
    resetRegion: () => setRegion('FR')
  }
}

// Hook simplifié pour lire seulement la région
export function useCurrentRegion(): Region {
  const { region } = usePersistentRegion()
  return region
}