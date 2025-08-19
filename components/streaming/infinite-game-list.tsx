'use client'

import { useState, useEffect, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import { GameCard } from '@/components/game-card'
import { GameCardSkeleton } from '@/components/game-card-skeleton'
import type { GameWithConsole } from '@/lib/data-prisma'

interface InfiniteGameListProps {
  initialGames: GameWithConsole[]
  consoleSlug?: string
  genreFilter?: string
  searchQuery?: string
  loadMoreAction: (offset: number, limit: number) => Promise<GameWithConsole[]>
}

export function InfiniteGameList({
  initialGames,
  consoleSlug,
  genreFilter,
  searchQuery,
  loadMoreAction
}: InfiniteGameListProps) {
  const [games, setGames] = useState(initialGames)
  const [offset, setOffset] = useState(initialGames.length)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '200px', // Commence à charger 200px avant d'atteindre le bas
  })

  const loadMoreGames = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    setError(null)

    try {
      const newGames = await loadMoreAction(offset, 20)
      
      if (newGames.length === 0) {
        setHasMore(false)
      } else {
        setGames(prev => [...prev, ...newGames])
        setOffset(prev => prev + newGames.length)
      }
    } catch (err) {
      setError('Erreur lors du chargement des jeux')
      console.error('Failed to load more games:', err)
    } finally {
      setIsLoading(false)
    }
  }, [offset, hasMore, isLoading, loadMoreAction])

  // Déclenchement automatique du chargement
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMoreGames()
    }
  }, [inView, hasMore, isLoading, loadMoreGames])

  // Reset quand les filtres changent
  useEffect(() => {
    setGames(initialGames)
    setOffset(initialGames.length)
    setHasMore(true)
    setError(null)
  }, [initialGames, consoleSlug, genreFilter, searchQuery])

  return (
    <div className="space-y-8">
      {/* Grille des jeux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {games.map((game, index) => (
          <GameCard 
            key={`${game.id}-${index}`} 
            game={game}
            priority={index < 10} // Priority pour les 10 premiers
          />
        ))}
      </div>

      {/* Trigger zone pour infinite scroll */}
      <div ref={ref} className="py-8">
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <GameCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={loadMoreGames}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {!hasMore && games.length > 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>Tous les jeux ont été chargés</p>
            <p className="text-sm mt-1">{games.length} jeux au total</p>
          </div>
        )}

        {!hasMore && games.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>Aucun jeu trouvé</p>
            {(genreFilter || searchQuery) && (
              <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Hook pour la gestion des dépendances
export function useInfiniteGameList(deps: any[]) {
  const [key, setKey] = useState(0)
  
  useEffect(() => {
    setKey(prev => prev + 1)
  }, deps)
  
  return key
}