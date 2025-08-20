'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { GameWithConsole } from '@/lib/data-prisma'
import { ConsoleGamesFilters, loadConsoleGamesStream } from '@/lib/actions/console-games-streaming-actions'
import GameCardRegionalWrapper from '@/components/game-card-regional-wrapper'

interface InfiniteConsoleGamesListProps {
  initialGames: GameWithConsole[]
  consoleSlug: string
  filters?: Omit<ConsoleGamesFilters, 'consoleSlug'>
}

export function InfiniteConsoleGamesList({ 
  initialGames, 
  consoleSlug, 
  filters = {}
}: InfiniteConsoleGamesListProps) {
  const [games, setGames] = useState<GameWithConsole[]>(initialGames)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialGames.length >= 20) // Assume more if we got full batch
  const [currentOffset, setCurrentOffset] = useState(initialGames.length)
  const observerTarget = useRef<HTMLDivElement>(null)

  // Reset when filters change
  useEffect(() => {
    setGames(initialGames)
    setCurrentOffset(initialGames.length)
    setHasMore(initialGames.length >= 20)
  }, [initialGames])

  const loadMoreGames = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const moreGames = await loadConsoleGamesStream(currentOffset, 20, {
        consoleSlug,
        ...filters
      })

      if (moreGames.length === 0) {
        setHasMore(false)
      } else {
        setGames(prev => [...prev, ...moreGames])
        setCurrentOffset(prev => prev + moreGames.length)
        setHasMore(moreGames.length >= 20) // Continue if we got full batch
      }
    } catch (error) {
      console.error('Error loading more games:', error)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, currentOffset, consoleSlug, filters])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMoreGames()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [loadMoreGames, hasMore, loading])

  if (games.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400">
          Aucun jeu trouvé avec les filtres actuels
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {games.map((game) => (
          <GameCardRegionalWrapper 
            key={game.id} 
            game={game} 
            showConsole={false}
          />
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Chargement des jeux...
          </span>
        </div>
      )}

      {/* Intersection observer target */}
      <div 
        ref={observerTarget} 
        className="h-4" 
        aria-hidden="true"
      />

      {/* End message */}
      {!hasMore && games.length > 0 && (
        <div className="text-center py-8">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Tous les jeux ont été chargés ({games.length} jeux)
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Hook for managing filter changes
 */
export function useConsoleGamesFilters() {
  const [filters, setFilters] = useState<Omit<ConsoleGamesFilters, 'consoleSlug'>>({})
  
  const updateFilter = useCallback((key: keyof Omit<ConsoleGamesFilters, 'consoleSlug'>, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  return {
    filters,
    updateFilter,
    clearFilters,
    setFilters
  }
}

/**
 * Stats component for console games
 */
export function ConsoleGamesStats({ 
  totalGames, 
  filteredCount,
  loading = false 
}: { 
  totalGames: number
  filteredCount: number
  loading?: boolean 
}) {
  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <div className="font-semibold text-lg text-gray-900 dark:text-white">
            {loading ? '...' : totalGames.toLocaleString('fr-FR')}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Jeux totaux
          </div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-lg text-gray-900 dark:text-white">
            {loading ? '...' : filteredCount.toLocaleString('fr-FR')}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Jeux affichés
          </div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-lg text-gray-900 dark:text-white">
            {loading ? '...' : Math.ceil(filteredCount / 20)}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Pages approx.
          </div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-lg text-gray-900 dark:text-white">
            20
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Par page
          </div>
        </div>
      </div>
    </div>
  )
}