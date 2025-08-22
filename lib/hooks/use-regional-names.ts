'use client'

import { useState, useEffect, useMemo } from 'react'
import { useEffectiveRegion } from '@/lib/hooks/use-regional-preferences'

/**
 * Hook to get regional console name based on current region preference
 * Optimized for better UX: keeps previous name during loading
 */
// Cache simple pour éviter les appels répétés
const nameCache = new Map<string, string>()

export function useRegionalConsoleName(consoleId: string): {
  name: string | null
  loading: boolean
  error: string | null
} {
  const currentRegion = useEffectiveRegion()
  
  // Clé de cache unique par console et région
  const cacheKey = useMemo(() => `${consoleId}-${currentRegion}`, [consoleId, currentRegion])
  
  const [result, setResult] = useState<{
    name: string | null
    loading: boolean
    error: string | null
  }>(() => {
    // Initialiser avec le cache si disponible
    const cachedName = nameCache.get(cacheKey)
    return {
      name: cachedName || null,
      loading: !cachedName, // Seulement en loading si pas en cache
      error: null
    }
  })

  useEffect(() => {
    // Si déjà en cache, utiliser directement
    const cachedName = nameCache.get(cacheKey)
    if (cachedName) {
      setResult({
        name: cachedName,
        loading: false,
        error: null
      })
      return
    }

    async function fetchConsoleName() {
      try {
        setResult(prev => ({ ...prev, loading: true }))
        
        // Import the server action dynamically to avoid SSR issues
        const { getConsoleName } = await import('@/lib/regional-names')
        const name = await getConsoleName(consoleId, currentRegion)
        
        // Mettre en cache
        nameCache.set(cacheKey, name)
        
        setResult({
          name,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Error fetching regional console name:', error)
        setResult(prev => ({
          name: prev.name, // Keep previous name on error
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      }
    }

    if (consoleId && currentRegion) {
      fetchConsoleName()
    }
  }, [cacheKey, consoleId, currentRegion])

  return result
}

/**
 * Hook to get regional game title based on current region preference
 * Optimized for better UX: keeps previous title during loading
 */
export function useRegionalGameTitle(gameId: string): {
  title: string | null
  loading: boolean
  error: string | null
} {
  const currentRegion = useEffectiveRegion()
  const [result, setResult] = useState<{
    title: string | null
    loading: boolean
    error: string | null
  }>({
    title: null,
    loading: false, // Start with loading false for better UX
    error: null
  })

  // Track if we're changing regions to show minimal loading
  const [isChangingRegion, setIsChangingRegion] = useState(false)

  useEffect(() => {
    async function fetchGameTitle() {
      try {
        // Only show loading for very short time when changing regions
        setIsChangingRegion(true)
        setTimeout(() => setIsChangingRegion(false), 100) // Very short loading state
        
        // Import the server action dynamically to avoid SSR issues
        const { getGameTitle } = await import('@/lib/regional-names')
        const title = await getGameTitle(gameId, currentRegion)
        
        setResult({
          title,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Error fetching regional game title:', error)
        setResult(prev => ({
          title: prev.title, // Keep previous title on error
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      }
    }

    if (gameId && currentRegion) {
      fetchGameTitle()
    }
  }, [gameId, currentRegion])

  return {
    ...result,
    loading: isChangingRegion // Use the short loading state
  }
}

/**
 * Hook to get regional release date based on current region preference
 * Optimized for better UX: keeps previous date during loading
 */
export function useRegionalReleaseDate(
  itemId: string, 
  itemType: 'console' | 'game'
): {
  releaseDate: Date | null
  loading: boolean
  error: string | null
} {
  const currentRegion = useEffectiveRegion()
  const [result, setResult] = useState<{
    releaseDate: Date | null
    loading: boolean
    error: string | null
  }>({
    releaseDate: null,
    loading: false, // Start with loading false for better UX
    error: null
  })

  // Track if we're changing regions to show minimal loading
  const [isChangingRegion, setIsChangingRegion] = useState(false)

  useEffect(() => {
    async function fetchReleaseDate() {
      try {
        // Only show loading for very short time when changing regions
        setIsChangingRegion(true)
        setTimeout(() => setIsChangingRegion(false), 100) // Very short loading state
        
        // Import the server actions dynamically to avoid SSR issues
        const { getConsoleReleaseDate, getGameReleaseDate } = await import('@/lib/regional-names')
        
        const releaseDate = itemType === 'console' 
          ? await getConsoleReleaseDate(itemId, currentRegion)
          : await getGameReleaseDate(itemId, currentRegion)
        
        setResult({
          releaseDate,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Error fetching regional release date:', error)
        setResult(prev => ({
          releaseDate: prev.releaseDate, // Keep previous date on error
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      }
    }

    if (itemId && currentRegion) {
      fetchReleaseDate()
    }
  }, [itemId, itemType, currentRegion])

  return {
    ...result,
    loading: isChangingRegion // Use the short loading state
  }
}