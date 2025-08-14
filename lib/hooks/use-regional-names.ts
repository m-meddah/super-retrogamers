'use client'

import { useState, useEffect } from 'react'
import { useCurrentRegion } from '@/lib/hooks/use-regional-preferences'

interface RegionalNameData {
  consoleName?: string
  gameTitle?: string
  releaseDate?: Date | null
  loading: boolean
  error: string | null
}

/**
 * Hook to get regional console name based on current region preference
 * Optimized for better UX: keeps previous name during loading
 */
export function useRegionalConsoleName(consoleId: string): {
  name: string | null
  loading: boolean
  error: string | null
} {
  const currentRegion = useCurrentRegion()
  const [result, setResult] = useState<{
    name: string | null
    loading: boolean
    error: string | null
  }>({
    name: null,
    loading: false, // Start with loading false for better UX
    error: null
  })

  // Track if we're changing regions to show minimal loading
  const [isChangingRegion, setIsChangingRegion] = useState(false)

  useEffect(() => {
    async function fetchConsoleName() {
      try {
        // Only show loading for very short time when changing regions
        setIsChangingRegion(true)
        setTimeout(() => setIsChangingRegion(false), 100) // Very short loading state
        
        // Import the server action dynamically to avoid SSR issues
        const { getConsoleName } = await import('@/lib/regional-names')
        const name = await getConsoleName(consoleId, currentRegion as any)
        
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
  }, [consoleId, currentRegion])

  return {
    ...result,
    loading: isChangingRegion // Use the short loading state
  }
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
  const currentRegion = useCurrentRegion()
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
        const title = await getGameTitle(gameId, currentRegion as any)
        
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
 */
export function useRegionalReleaseDate(
  itemId: string, 
  itemType: 'console' | 'game'
): {
  releaseDate: Date | null
  loading: boolean
  error: string | null
} {
  const currentRegion = useCurrentRegion()
  const [result, setResult] = useState<{
    releaseDate: Date | null
    loading: boolean
    error: string | null
  }>({
    releaseDate: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    async function fetchReleaseDate() {
      try {
        setResult(prev => ({ ...prev, loading: true, error: null }))
        
        // Import the server actions dynamically to avoid SSR issues
        const { getConsoleReleaseDate, getGameReleaseDate } = await import('@/lib/regional-names')
        
        const releaseDate = itemType === 'console' 
          ? await getConsoleReleaseDate(itemId, currentRegion as any)
          : await getGameReleaseDate(itemId, currentRegion as any)
        
        setResult({
          releaseDate,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Error fetching regional release date:', error)
        setResult({
          releaseDate: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    if (itemId && currentRegion) {
      fetchReleaseDate()
    }
  }, [itemId, itemType, currentRegion])

  return result
}